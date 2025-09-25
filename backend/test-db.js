import Database from 'better-sqlite3';

const db = new Database('./data/database.sqlite');

// Check if pixels table exists and has data
try {
  const result = db.prepare("SELECT COUNT(*) as count FROM pixels").get();
  console.log(`Total pixels in database: ${result.count}`);
  
  // Get recent pixels
  const recentPixels = db.prepare("SELECT * FROM pixels ORDER BY placed_at DESC LIMIT 5").all();
  console.log('Recent pixels:', recentPixels);
  
  // Check users table with all details
  const users = db.prepare("SELECT * FROM users").all();
  console.log('Users with all details:', users);
  
} catch (error) {
  console.error('Database error:', error);
}

db.close();