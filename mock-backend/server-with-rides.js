const express = require('express');
const cors = require('cors');

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

// In-Memory Storage for mock server
let events = [];
let guests = [];
let contributions = [];
let invitations = [];
let rideOffers = [];
let rideRequests = [];
let rideMatches = [];
let currentId = 1;

// Generate unique code
function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 14);
}

// Generate unique guest token (longer for security)
function generateUniqueToken() {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// Helper function to find event by code
function findEventByCode(code) {
  return events.find(event => event.unique_code === code);
}

// Helper function to find guest by token
function findGuestByToken(token) {
  return guests.find(guest => guest.unique_token === token);
}

// API Routes
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Feierapp Mock API with Ride Sharing is running',
    version: '1.0.0',
    endpoints: {
      'GET /events': 'List all events',
      'POST /events': 'Create new event',
      'GET /events/{code}': 'Get event by code',
      'GET /events/{code}/rides': 'Get rides for event',
      'POST /events/{code}/ride-offers': 'Create ride offer',
      'POST /events/{code}/ride-requests': 'Create ride request',
      'GET /guests/{token}/rides': 'Get rides for guest'
    }
  });
});

// Events endpoints
app.get('/events', (req, res) => {
  res.json(events);
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
  const newEvent = {
    id: currentId++,
    title,
    description,
    event_date,
    location,
    planner_name,
    planner_email,
    planner_phone,
    unique_code,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  events.push(newEvent);
  console.log('Event created:', newEvent);
  res.status(201).json(newEvent);
});

app.get('/events/:code', (req, res) => {
  const event = findEventByCode(req.params.code);
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const eventGuests = guests.filter(guest => guest.event_id === event.id);
  
  const response = {
    event: event,
    guests: eventGuests,
    statistics: {
      total_guests: eventGuests.length,
      accepted: eventGuests.filter(g => g.status === 'accepted').length,
      declined: eventGuests.filter(g => g.status === 'declined').length,
      pending: eventGuests.filter(g => g.status === 'pending').length,
      total_children: eventGuests.reduce((sum, g) => sum + (g.children_count || 0), 0),
    }
  };
  
  res.json(response);
});

// Guests endpoints
app.post('/events/:code/guests', (req, res) => {
  const { name, email, phone, dietary_restrictions } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(422).json({
      error: 'Name ist erforderlich'
    });
  }
  
  const event = findEventByCode(req.params.code);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const uniqueToken = generateUniqueToken();
  
  const newGuest = {
    id: currentId++,
    event_id: event.id,
    name: name.trim(),
    email: email || null,
    phone: phone || null,
    unique_token: uniqueToken,
    status: 'pending',
    children_count: 0,
    dietary_restrictions: dietary_restrictions || null,
    special_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  guests.push(newGuest);
  console.log('Guest created:', newGuest);
  res.status(201).json(newGuest);
});

app.get('/guests/:token', (req, res) => {
  const guest = findGuestByToken(req.params.token);
  
  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }
  
  const event = events.find(e => e.id === guest.event_id);
  
  res.json({
    guest: guest,
    event: event
  });
});

// RIDE SHARING ENDPOINTS

// Get all rides for an event
app.get('/events/:code/rides', (req, res) => {
  const event = findEventByCode(req.params.code);
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const eventOffers = rideOffers.filter(offer => offer.event_id === event.id);
  const eventRequests = rideRequests.filter(request => request.event_id === event.id);
  
  // Add driver info to offers
  const offersWithDriver = eventOffers.map(offer => ({
    ...offer,
    driver: guests.find(g => g.id === offer.driver_guest_id),
    remaining_seats: offer.available_seats, // Simplified for mock
    confirmed_matches_count: 0
  }));
  
  // Add passenger info to requests
  const requestsWithPassenger = eventRequests.map(request => ({
    ...request,
    passenger: guests.find(g => g.id === request.passenger_guest_id),
    confirmed_match: null
  }));
  
  const statistics = {
    total_offers: eventOffers.length,
    active_offers: eventOffers.filter(o => o.status === 'active').length,
    total_requests: eventRequests.length,
    open_requests: eventRequests.filter(r => r.status === 'open').length,
    total_available_seats: eventOffers.reduce((sum, o) => sum + o.available_seats, 0)
  };
  
  res.json({
    offers: offersWithDriver,
    requests: requestsWithPassenger,
    statistics: statistics
  });
});

// Create ride offer
app.post('/events/:code/ride-offers', (req, res) => {
  const event = findEventByCode(req.params.code);
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const { guest_token, departure_location, departure_time, available_seats, car_description, notes, contact_info } = req.body;
  
  if (!guest_token) {
    return res.status(400).json({ error: 'Guest token is required' });
  }
  
  const guest = findGuestByToken(guest_token);
  if (!guest || guest.event_id !== event.id) {
    return res.status(404).json({ error: 'Guest not found' });
  }
  
  const newOffer = {
    id: currentId++,
    event_id: event.id,
    driver_guest_id: guest.id,
    departure_location,
    departure_time,
    available_seats: parseInt(available_seats) || 1,
    car_description,
    notes,
    contact_info: contact_info || guest.phone || guest.email,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  rideOffers.push(newOffer);
  console.log('Ride offer created:', newOffer);
  res.status(201).json(newOffer);
});

// Create ride request
app.post('/events/:code/ride-requests', (req, res) => {
  const event = findEventByCode(req.params.code);
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const { guest_token, pickup_location, flexible_pickup, passenger_count, notes } = req.body;
  
  if (!guest_token) {
    return res.status(400).json({ error: 'Guest token is required' });
  }
  
  const guest = findGuestByToken(guest_token);
  if (!guest || guest.event_id !== event.id) {
    return res.status(404).json({ error: 'Guest not found' });
  }
  
  const newRequest = {
    id: currentId++,
    event_id: event.id,
    passenger_guest_id: guest.id,
    pickup_location,
    flexible_pickup: flexible_pickup || false,
    passenger_count: parseInt(passenger_count) || 1,
    notes,
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  rideRequests.push(newRequest);
  console.log('Ride request created:', newRequest);
  res.status(201).json(newRequest);
});

// Get rides for specific guest
app.get('/guests/:token/rides', (req, res) => {
  const guest = findGuestByToken(req.params.token);
  
  if (!guest) {
    return res.status(404).json({ error: 'Guest not found' });
  }
  
  const guestOffers = rideOffers.filter(offer => offer.driver_guest_id === guest.id);
  const guestRequests = rideRequests.filter(request => request.passenger_guest_id === guest.id);
  
  res.json({
    offers: guestOffers,
    requests: guestRequests
  });
});

// Create ride match (simplified)
app.post('/ride-matches', (req, res) => {
  const { ride_offer_id, ride_request_id, pickup_location, notes } = req.body;
  
  const newMatch = {
    id: currentId++,
    ride_offer_id,
    ride_request_id,
    pickup_location,
    notes,
    status: 'pending',
    driver_confirmed: false,
    passenger_confirmed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  rideMatches.push(newMatch);
  console.log('Ride match created:', newMatch);
  res.status(201).json(newMatch);
});

app.listen(PORT, () => {
  console.log(`Mock Backend Server with Ride Sharing running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/events`);
  console.log(`  POST http://localhost:${PORT}/events`);
  console.log(`  GET  http://localhost:${PORT}/events/{code}/rides`);
  console.log(`  POST http://localhost:${PORT}/events/{code}/ride-offers`);
  console.log(`  POST http://localhost:${PORT}/events/{code}/ride-requests`);
  console.log(`  GET  http://localhost:${PORT}/guests/{token}/rides`);
});