/**
 * User Model - In-Memory User Storage
 * Simple in-memory user store for demonstration purposes
 * 
 * NOTE: This is a development/demo implementation
 * In production, replace with proper database integration (see db.js)
 */

// === IN-MEMORY USER STORAGE ===
// Array to store user objects in memory
// WARNING: Data will be lost when server restarts
const users = [];

/**
 * Find user by username
 * @param {string} username - Username to search for
 * @returns {Object|undefined} - User object if found, undefined otherwise
 */
export function findUserByUsername(username) {
  return users.find((user) => user.username === username);
}

/**
 * Add new user to in-memory store
 * @param {Object} user - User object to add
 * @param {string} user.username - User's username
 * @param {string} user.password - User's hashed password
 * @param {*} [user.*] - Any additional user properties
 */
export function addUser(user) {
  // Initialize user statistics
  const userWithStats = {
    ...user,
    pixelsPlaced: 0,
    totalContributions: 0,
    joinedAt: new Date(),
    lastActive: new Date(),
    isOnline: false
  };
  
  users.push(userWithStats);
  console.log(`User added to memory store: ${user.username}`);
}

/**
 * Update user statistics when they place a pixel
 * @param {string} username - Username to update
 */
export function incrementUserPixels(username) {
  const user = findUserByUsername(username);
  if (user) {
    user.pixelsPlaced = (user.pixelsPlaced || 0) + 1;
    user.totalContributions = (user.totalContributions || 0) + 1;
    user.lastActive = new Date();
    console.log(`Updated stats for ${username}: ${user.pixelsPlaced} pixels`);
  }
}

/**
 * Update user's online status
 * @param {string} username - Username to update
 * @param {boolean} isOnline - Online status
 */
export function updateUserOnlineStatus(username, isOnline) {
  const user = findUserByUsername(username);
  if (user) {
    user.isOnline = isOnline;
    if (isOnline) {
      user.lastActive = new Date();
    }
  }
}

/**
 * Get all users for leaderboard
 * @returns {Array} - Array of user objects with public information
 */
export function getAllUsersForLeaderboard() {
  return users.map(user => ({
    username: user.username,
    pixelsPlaced: user.pixelsPlaced || 0,
    totalContributions: user.totalContributions || 0,
    joinedAt: user.joinedAt,
    lastActive: user.lastActive,
    isOnline: user.isOnline || false
  }));
}
