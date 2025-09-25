/**
 * Database Setup and Operations
 * SQLite database implementation for user management
 * Handles user authentication and data storage
 */

// === DATABASE DEPENDENCIES ===
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';

// === DATABASE CONNECTION ===
let db; // Global database connection instance

/**
 * Initialize SQLite database
 * Creates database file and user table if they don't exist
 * @returns {Promise} - Resolves when database is ready
 */
export function initDB() {
  try {
    // Ensure data directory exists
    const dataDir = './data';
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    db = new Database('./data/database.sqlite');
    
    // Create users table
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      pixels_placed INTEGER DEFAULT 0,
      total_contributions INTEGER DEFAULT 0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_online BOOLEAN DEFAULT 0,
      data TEXT
    )`);
    
    // Create pixels table to store all pixel placements
    db.exec(`CREATE TABLE IF NOT EXISTS pixels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grid_key TEXT UNIQUE NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      color TEXT NOT NULL,
      username TEXT NOT NULL,
      placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (username) REFERENCES users(username)
    )`);
    
    // Create index on grid coordinates for faster lookups
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pixels_coords ON pixels(x, y)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pixels_key ON pixels(grid_key)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_pixels_username ON pixels(username)`);
    
    // Add new columns if they don't exist (for database migration)
    try {
      db.exec(`ALTER TABLE users ADD COLUMN pixels_placed INTEGER DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }
    try {
      db.exec(`ALTER TABLE users ADD COLUMN total_contributions INTEGER DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }
    try {
      db.exec(`ALTER TABLE users ADD COLUMN joined_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
    } catch (e) {
      // Column might already exist
    }
    try {
      db.exec(`ALTER TABLE users ADD COLUMN last_active DATETIME DEFAULT CURRENT_TIMESTAMP`);
    } catch (e) {
      // Column might already exist
    }
    try {
      db.exec(`ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }
    
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

/**
 * Get database connection instance
 * @returns {Object} - Database connection object
 */
export function getDB() {
  return db;
}

/**
 * Find user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} - User object or null if not found
 */
export function findUserByUsername(username) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

/**
 * Add new user to database
 * @param {Object} user - User object with username, password, and optional data
 * @param {string} user.username - Unique username
 * @param {string} user.password - Hashed password
 * @param {string} [user.data] - Optional additional user data (JSON string)
 * @returns {Promise} - Database insertion result
 */
export function addUser(user) {
  try {
    const stmt = db.prepare(`
      INSERT INTO users (username, password, pixels_placed, total_contributions, joined_at, last_active, is_online, data) 
      VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, ?)
    `);
    return stmt.run(user.username, user.password, user.data || null);
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
}

/**
 * Update user statistics when they place a pixel
 * @param {string} username - Username to update
 * @returns {Promise} - Database update result
 */
export function incrementUserPixels(username) {
  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET pixels_placed = pixels_placed + 1, 
          total_contributions = total_contributions + 1,
          last_active = CURRENT_TIMESTAMP 
      WHERE username = ?
    `);
    return stmt.run(username);
  } catch (error) {
    console.error("Error updating user pixels:", error);
    throw error;
  }
}

/**
 * Update user's online status
 * @param {string} username - Username to update
 * @param {boolean} isOnline - Online status
 * @returns {Promise} - Database update result
 */
export function updateUserOnlineStatus(username, isOnline) {
  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET is_online = ?, last_active = CURRENT_TIMESTAMP 
      WHERE username = ?
    `);
    return stmt.run(isOnline ? 1 : 0, username);
  } catch (error) {
    console.error("Error updating user online status:", error);
    throw error;
  }
}

/**
 * Get all users for leaderboard with their statistics
 * @returns {Array} - Array of user objects with public information
 */
export function getAllUsersForLeaderboard() {
  try {
    const stmt = db.prepare(`
      SELECT username, pixels_placed, total_contributions, joined_at, last_active, is_online
      FROM users 
      ORDER BY pixels_placed DESC
    `);
    return stmt.all();
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    throw error;
  }
}

/**
 * Save a pixel placement to the database
 * @param {string} gridKey - Grid key in format "x,y"
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} color - Pixel color
 * @param {string} username - Username who placed the pixel
 * @returns {Promise} - Database insertion result
 */
export function savePixel(gridKey, x, y, color, username) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO pixels (grid_key, x, y, color, username, placed_at) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(gridKey, x, y, color, username);
  } catch (error) {
    console.error("Error saving pixel:", error);
    throw error;
  }
}

/**
 * Load all pixels from the database
 * @returns {Object} - Grid state object in format { "x,y": { color, username } }
 */
export function loadAllPixels() {
  try {
    const stmt = db.prepare(`
      SELECT grid_key, color, username, placed_at 
      FROM pixels 
      ORDER BY placed_at ASC
    `);
    const pixels = stmt.all();
    
    // Convert to grid state format
    const gridState = {};
    pixels.forEach(pixel => {
      gridState[pixel.grid_key] = {
        color: pixel.color,
        username: pixel.username,
        placed_at: pixel.placed_at
      };
    });
    
    return gridState;
  } catch (error) {
    console.error("Error loading pixels:", error);
    throw error;
  }
}

/**
 * Check if a pixel exists at the given coordinates
 * @param {string} gridKey - Grid key in format "x,y"
 * @returns {Object|null} - Pixel data or null if not found
 */
export function getPixel(gridKey) {
  try {
    const stmt = db.prepare(`
      SELECT grid_key, x, y, color, username, placed_at 
      FROM pixels 
      WHERE grid_key = ?
    `);
    return stmt.get(gridKey);
  } catch (error) {
    console.error("Error getting pixel:", error);
    throw error;
  }
}

/**
 * Get pixel statistics
 * @returns {Object} - Statistics about pixels
 */
export function getPixelStats() {
  try {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_pixels,
        COUNT(DISTINCT username) as unique_users,
        MIN(placed_at) as first_pixel_date,
        MAX(placed_at) as latest_pixel_date
      FROM pixels
    `);
    return stmt.get();
  } catch (error) {
    console.error("Error getting pixel stats:", error);
    throw error;
  }
}

/**
 * Update user data field
 * @param {string} username - Username of user to update
 * @param {string} newData - New data to store (typically JSON string)
 * @returns {Promise} - Database update result
 */
export function overwriteUserData(username, newData) {
  try {
    const stmt = db.prepare('UPDATE users SET data = ? WHERE username = ?');
    return stmt.run(newData, username);
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
}
