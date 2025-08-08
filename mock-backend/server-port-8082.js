const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 8082; // Different port

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

// API Routes - Basic ones
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Feierapp Test API with Ride Sharing is running',
    version: '1.0.0',
    port: PORT
  });
});

app.post('/events', (req, res) => {
  const { title, event_date, location, planner_name, planner_email, planner_phone, description } = req.body;
  
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

app.listen(PORT, () => {
  console.log(`Test Backend Server with Ride Sharing running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  POST http://localhost:${PORT}/events`);
  console.log(`  GET  http://localhost:${PORT}/events/{code}/rides`);
});