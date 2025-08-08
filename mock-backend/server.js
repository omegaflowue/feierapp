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

app.listen(PORT, () => {
  console.log(`Mock Backend Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/events`);
  console.log(`  POST http://localhost:${PORT}/events`);
});