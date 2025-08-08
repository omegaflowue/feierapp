const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 8081;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

app.use(express.json());

// MySQL Database connection
const db = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'feierapp'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Generate unique code
function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 14);
}

// Generate unique guest token (longer for security)
function generateUniqueToken() {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// API Routes
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Feierapp Mock API is running',
    version: '1.0.0',
    endpoints: {
      'GET /events': 'List all events',
      'POST /events': 'Create new event',
      'GET /events/{code}': 'Get event by code'
    }
  });
});

app.get('/events', (req, res) => {
  db.query('SELECT * FROM events ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/events', (req, res) => {
  const { title, event_date, location, planner_name, planner_email, planner_phone, description } = req.body;
  
  // Simple validation
  if (!title || !event_date || !location || !planner_name || !planner_email) {
    return res.status(422).json({
      errors: {
        title: title ? [] : ['Title is required'],
        event_date: event_date ? [] : ['Event date is required'],
        location: location ? [] : ['Location is required'],
        planner_name: planner_name ? [] : ['Planner name is required'],
        planner_email: planner_email ? [] : ['Planner email is required']
      }
    });
  }
  
  const unique_code = generateUniqueCode();
  const insertQuery = `
    INSERT INTO events (title, description, event_date, location, planner_name, planner_email, planner_phone, unique_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(insertQuery, [title, description, event_date, location, planner_name, planner_email, planner_phone, unique_code], (err, result) => {
    if (err) {
      console.error('Error creating event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get the created event
    db.query('SELECT * FROM events WHERE id = ?', [result.insertId], (err, results) => {
      if (err) {
        console.error('Error fetching created event:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const newEvent = results[0];
      console.log('Event created in database:', newEvent);
      res.status(201).json(newEvent);
    });
  });
});

app.get('/events/:code', (req, res) => {
  db.query('SELECT * FROM events WHERE unique_code = ?', [req.params.code], (err, results) => {
    if (err) {
      console.error('Error fetching event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = results[0];
    console.log('Event retrieved from database:', event);
    res.json(event);
  });
});

// Get guests for an event
app.get('/events/:code/guests', (req, res) => {
  // First get the event ID
  db.query('SELECT id FROM events WHERE unique_code = ?', [req.params.code], (err, eventResults) => {
    if (err) {
      console.error('Error fetching event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (eventResults.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventId = eventResults[0].id;
    
    // Get guests for this event
    db.query('SELECT * FROM guests WHERE event_id = ? ORDER BY created_at ASC', [eventId], (err, guestResults) => {
      if (err) {
        console.error('Error fetching guests:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log(`Found ${guestResults.length} guests for event ${req.params.code}`);
      res.json(guestResults);
    });
  });
});

// Add guest to event
app.post('/events/:code/guests', (req, res) => {
  const { name, email, phone, dietary_restrictions } = req.body;
  
  // Validation
  if (!name || !name.trim()) {
    return res.status(422).json({
      error: 'Name ist erforderlich'
    });
  }
  
  // First get the event ID
  db.query('SELECT id FROM events WHERE unique_code = ?', [req.params.code], (err, eventResults) => {
    if (err) {
      console.error('Error fetching event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (eventResults.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventId = eventResults[0].id;
    const uniqueToken = generateUniqueToken();
    
    // Insert guest
    const insertQuery = `
      INSERT INTO guests (event_id, name, email, phone, unique_token, status, dietary_restrictions)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `;
    
    db.query(insertQuery, [eventId, name.trim(), email || null, phone || null, uniqueToken, dietary_restrictions || null], (err, result) => {
      if (err) {
        console.error('Error creating guest:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Get the created guest
      db.query('SELECT * FROM guests WHERE id = ?', [result.insertId], (err, guestResults) => {
        if (err) {
          console.error('Error fetching created guest:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        const newGuest = guestResults[0];
        console.log('Guest created in database:', newGuest);
        res.status(201).json(newGuest);
      });
    });
  });
});

// RIDE SHARING ENDPOINTS

// Get all rides for an event
app.get('/events/:code/rides', (req, res) => {
  // First get the event ID
  db.query('SELECT id FROM events WHERE unique_code = ?', [req.params.code], (err, eventResults) => {
    if (err) {
      console.error('Error fetching event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (eventResults.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventId = eventResults[0].id;
    
    // Get ride offers for this event
    db.query(`
      SELECT ro.*, g.name as driver_name, g.email as driver_email, g.phone as driver_phone
      FROM ride_offers ro 
      LEFT JOIN guests g ON ro.driver_guest_id = g.id 
      WHERE ro.event_id = ? 
      ORDER BY ro.departure_time ASC
    `, [eventId], (err, offers) => {
      if (err) {
        console.error('Error fetching ride offers:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Get ride requests for this event
      db.query(`
        SELECT rr.*, g.name as passenger_name, g.email as passenger_email, g.phone as passenger_phone
        FROM ride_requests rr 
        LEFT JOIN guests g ON rr.passenger_guest_id = g.id 
        WHERE rr.event_id = ? 
        ORDER BY rr.created_at DESC
      `, [eventId], (err, requests) => {
        if (err) {
          console.error('Error fetching ride requests:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Format offers with driver info and remaining seats
        const formattedOffers = offers.map(offer => ({
          ...offer,
          driver: {
            name: offer.driver_name,
            email: offer.driver_email,
            phone: offer.driver_phone
          },
          remaining_seats: offer.available_seats, // Simplified for now
          confirmed_matches_count: 0
        }));
        
        // Format requests with passenger info
        const formattedRequests = requests.map(request => ({
          ...request,
          passenger: {
            name: request.passenger_name,
            email: request.passenger_email,
            phone: request.passenger_phone
          },
          confirmed_match: null
        }));
        
        const statistics = {
          total_offers: offers.length,
          active_offers: offers.filter(o => o.status === 'active').length,
          total_requests: requests.length,
          open_requests: requests.filter(r => r.status === 'open').length,
          total_available_seats: offers.reduce((sum, o) => sum + o.available_seats, 0)
        };
        
        console.log(`Found ${offers.length} ride offers and ${requests.length} ride requests for event ${req.params.code}`);
        res.json({
          offers: formattedOffers,
          requests: formattedRequests,
          statistics: statistics
        });
      });
    });
  });
});

// Create ride offer
app.post('/events/:code/ride-offers', (req, res) => {
  const { guest_token, departure_location, departure_time, available_seats, car_description, notes, contact_info } = req.body;
  
  if (!guest_token) {
    return res.status(400).json({ error: 'Guest token is required' });
  }
  
  // First get the event
  db.query('SELECT id FROM events WHERE unique_code = ?', [req.params.code], (err, eventResults) => {
    if (err) {
      console.error('Error fetching event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (eventResults.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventId = eventResults[0].id;
    
    // Find guest by token
    db.query('SELECT * FROM guests WHERE unique_token = ? AND event_id = ?', [guest_token, eventId], (err, guestResults) => {
      if (err) {
        console.error('Error fetching guest:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (guestResults.length === 0) {
        return res.status(404).json({ error: 'Guest not found' });
      }
      
      const guest = guestResults[0];
      
      const insertQuery = `
        INSERT INTO ride_offers (event_id, driver_guest_id, departure_location, departure_time, available_seats, car_description, notes, contact_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(insertQuery, [
        eventId,
        guest.id,
        departure_location,
        departure_time,
        parseInt(available_seats) || 1,
        car_description,
        notes,
        contact_info || guest.phone || guest.email
      ], (err, result) => {
        if (err) {
          console.error('Error creating ride offer:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Get the created offer
        db.query('SELECT * FROM ride_offers WHERE id = ?', [result.insertId], (err, offerResults) => {
          if (err) {
            console.error('Error fetching created offer:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          const newOffer = offerResults[0];
          console.log('Ride offer created:', newOffer);
          res.status(201).json(newOffer);
        });
      });
    });
  });
});

// Create ride request
app.post('/events/:code/ride-requests', (req, res) => {
  const { guest_token, pickup_location, flexible_pickup, passenger_count, notes } = req.body;
  
  if (!guest_token) {
    return res.status(400).json({ error: 'Guest token is required' });
  }
  
  // First get the event
  db.query('SELECT id FROM events WHERE unique_code = ?', [req.params.code], (err, eventResults) => {
    if (err) {
      console.error('Error fetching event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (eventResults.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventId = eventResults[0].id;
    
    // Find guest by token
    db.query('SELECT * FROM guests WHERE unique_token = ? AND event_id = ?', [guest_token, eventId], (err, guestResults) => {
      if (err) {
        console.error('Error fetching guest:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (guestResults.length === 0) {
        return res.status(404).json({ error: 'Guest not found' });
      }
      
      const guest = guestResults[0];
      
      const insertQuery = `
        INSERT INTO ride_requests (event_id, passenger_guest_id, pickup_location, flexible_pickup, passenger_count, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.query(insertQuery, [
        eventId,
        guest.id,
        pickup_location,
        flexible_pickup || false,
        parseInt(passenger_count) || 1,
        notes
      ], (err, result) => {
        if (err) {
          console.error('Error creating ride request:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Get the created request
        db.query('SELECT * FROM ride_requests WHERE id = ?', [result.insertId], (err, requestResults) => {
          if (err) {
            console.error('Error fetching created request:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          const newRequest = requestResults[0];
          console.log('Ride request created:', newRequest);
          res.status(201).json(newRequest);
        });
      });
    });
  });
});

// Get rides for specific guest
app.get('/guests/:token/rides', (req, res) => {
  // Find guest by token
  db.query('SELECT * FROM guests WHERE unique_token = ?', [req.params.token], (err, guestResults) => {
    if (err) {
      console.error('Error fetching guest:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (guestResults.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    const guest = guestResults[0];
    
    // Get guest's ride offers
    db.query('SELECT * FROM ride_offers WHERE driver_guest_id = ?', [guest.id], (err, offers) => {
      if (err) {
        console.error('Error fetching guest offers:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Get guest's ride requests
      db.query('SELECT * FROM ride_requests WHERE passenger_guest_id = ?', [guest.id], (err, requests) => {
        if (err) {
          console.error('Error fetching guest requests:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        console.log(`Found ${offers.length} offers and ${requests.length} requests for guest ${req.params.token}`);
        res.json({
          offers: offers,
          requests: requests
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Mock Backend Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/events`);
  console.log(`  POST http://localhost:${PORT}/events`);
  console.log(`  GET  http://localhost:${PORT}/events/{code}/rides`);
  console.log(`  POST http://localhost:${PORT}/events/{code}/ride-offers`);
  console.log(`  POST http://localhost:${PORT}/events/{code}/ride-requests`);
  console.log(`  GET  http://localhost:${PORT}/guests/{token}/rides`);
});