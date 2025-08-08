const mysql = require('mysql2');

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
  
  // Run migration
  migrateTables();
});

function migrateTables() {
  const migrations = [
    `
    CREATE TABLE IF NOT EXISTS ride_offers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_id INT NOT NULL,
        driver_guest_id INT NOT NULL,
        departure_location VARCHAR(500) NOT NULL,
        departure_time DATETIME NOT NULL,
        available_seats INT NOT NULL DEFAULT 1,
        car_description VARCHAR(255),
        notes TEXT,
        contact_info VARCHAR(255),
        status ENUM('active', 'full', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_guest_id) REFERENCES guests(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS ride_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_id INT NOT NULL,
        passenger_guest_id INT NOT NULL,
        pickup_location VARCHAR(500) NOT NULL,
        flexible_pickup BOOLEAN DEFAULT FALSE,
        passenger_count INT DEFAULT 1,
        notes TEXT,
        status ENUM('open', 'matched', 'cancelled') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (passenger_guest_id) REFERENCES guests(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS ride_matches (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ride_offer_id INT NOT NULL,
        ride_request_id INT NOT NULL,
        status ENUM('pending', 'confirmed', 'declined', 'cancelled') DEFAULT 'pending',
        driver_confirmed BOOLEAN DEFAULT FALSE,
        passenger_confirmed BOOLEAN DEFAULT FALSE,
        pickup_location VARCHAR(500),
        pickup_time DATETIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ride_offer_id) REFERENCES ride_offers(id) ON DELETE CASCADE,
        FOREIGN KEY (ride_request_id) REFERENCES ride_requests(id) ON DELETE CASCADE,
        UNIQUE KEY unique_match (ride_offer_id, ride_request_id)
    )
    `,
    'CREATE INDEX IF NOT EXISTS idx_ride_offers_event ON ride_offers(event_id)',
    'CREATE INDEX IF NOT EXISTS idx_ride_offers_driver ON ride_offers(driver_guest_id)',
    'CREATE INDEX IF NOT EXISTS idx_ride_offers_status ON ride_offers(status)',
    'CREATE INDEX IF NOT EXISTS idx_ride_requests_event ON ride_requests(event_id)',
    'CREATE INDEX IF NOT EXISTS idx_ride_requests_passenger ON ride_requests(passenger_guest_id)',
    'CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status)',
    'CREATE INDEX IF NOT EXISTS idx_ride_matches_offer ON ride_matches(ride_offer_id)',
    'CREATE INDEX IF NOT EXISTS idx_ride_matches_request ON ride_matches(ride_request_id)',
    'CREATE INDEX IF NOT EXISTS idx_ride_matches_status ON ride_matches(status)'
  ];

  let completedMigrations = 0;
  
  migrations.forEach((migration, index) => {
    db.query(migration, (err, results) => {
      if (err) {
        console.error(`Error running migration ${index + 1}:`, err.message);
      } else {
        console.log(`✅ Migration ${index + 1} completed successfully`);
      }
      
      completedMigrations++;
      if (completedMigrations === migrations.length) {
        console.log('🎉 All ride sharing table migrations completed!');
        db.end();
      }
    });
  });
}