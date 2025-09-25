// === CORE DEPENDENCIES ===
import express from "express";          // Web framework for Node.js
import cors from "cors";                // Cross-Origin Resource Sharing middleware
import dotenv from "dotenv";            // Environment variable loader
import path from "path";
import { fileURLToPath } from "url";

// === AUTHENTICATION DEPENDENCIES ===
import bcrypt from "bcrypt";            // Password hashing library
import jwt from "jsonwebtoken";         // JSON Web Token implementation


// === DATABASE INTEGRATION ===
import { initDB, findUserByUsername, addUser, incrementUserPixels, updateUserOnlineStatus, getAllUsersForLeaderboard, savePixel, loadAllPixels, getPixelStats } from "./db.js";

// === WEBSOCKET DEPENDENCIES ===
import http from "http";                // HTTP server for WebSocket upgrade
import { WebSocketServer } from "ws";   // WebSocket server implementation

// Load environment variables from .env file
dotenv.config();

// For ES modules (__dirname workaround)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === SERVER SETUP ===
const app = express();                  // Create Express application
const server = http.createServer(app);  // Create HTTP server for WebSocket support

// === MIDDLEWARE CONFIGURATION ===
app.use(cors());                        // Enable CORS for all routes
app.use(express.json());                // Parse JSON request bodies
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// === MULTIPLAYER WEBSOCKET SETUP ===
// WebSocket server for real-time collaborative pixel art
const wss = new WebSocketServer({ server });

// === SHARED GAME STATE ===
// Grid state: { "x,y": { color, username } }
// Stores all placed pixels with their color and owner information
let gridState = {};

/**
 * WebSocket connection handler
 * Manages real-time communication between clients for collaborative editing
 */
wss.on("connection", (ws) => {
  console.log("New WebSocket connection established");
  
  // Store username for this connection
  ws.username = null;
  
  // === INITIAL STATE SYNC ===
  // Send current grid state to newly connected client
  ws.send(JSON.stringify({ type: "init", grid: gridState }));

  /**
   * Handle incoming messages from clients
   * Processes pixel placement requests and other game actions
   */
  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
      console.log(`📨 Received WebSocket message:`, data); // Debug logging
    } catch (e) {
      console.error("Invalid JSON message received:", e);
      return;
    }
    
    // === USER AUTHENTICATION FOR WEBSOCKET ===
    if (data.type === "authenticate" && data.username) {
      ws.username = data.username;
      updateUserOnlineStatus(data.username, true);
      console.log(`WebSocket authenticated for user: ${data.username}`);
      return;
    }
    
    // === PIXEL PLACEMENT HANDLER ===
    if (data.type === "colorCell" && data.key && data.color && data.username) {
      console.log(`🎨 Processing colorCell request: ${data.key} -> ${data.color} by ${data.username}`); // Debug logging
      
      // Only allow coloring if cell is empty (first-come-first-served)
      if (!gridState[data.key]) {
        console.log(`✅ Cell ${data.key} is empty, placing pixel`); // Debug logging
        
        // Update server grid state
        gridState[data.key] = { 
          color: data.color, 
          username: data.username 
        };
        
        // Parse coordinates from key (format: "x,y")
        const [x, y] = data.key.split(',').map(Number);
        
        // Save pixel to database
        try {
          savePixel(data.key, x, y, data.color, data.username);
          console.log(`💾 Pixel saved to database: ${data.key} by ${data.username}`);
        } catch (error) {
          console.error('❌ Error saving pixel to database:', error);
        }
        
        // Update user statistics
        incrementUserPixels(data.username);
        
        // === BROADCAST TO ALL CLIENTS ===
        // Notify all connected clients of the pixel placement
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ 
              type: "cellUpdate", 
              key: data.key, 
              color: data.color, 
              username: data.username 
            }));
          }
        });
        
        console.log(`🎯 Pixel placed at ${data.key} by ${data.username}, broadcasted to ${wss.clients.size} clients`);
      } else {
        console.log(`⚠️  Cell ${data.key} already occupied by ${gridState[data.key].username}, placement rejected`);
      }
    } else if (data.type === "colorCell") {
      console.log(`❌ Invalid colorCell message - missing required fields:`, { 
        hasType: !!data.type, 
        hasKey: !!data.key, 
        hasColor: !!data.color, 
        hasUsername: !!data.username 
      });
    }
    
    // TODO: Handle additional message types (payment confirmations, cooldown updates, etc.)
  });

  /**
   * Handle WebSocket disconnection
   * Clean up any client-specific resources if needed
   */
  ws.on("close", () => {
    console.log("WebSocket connection closed");
    // Update user's online status
    if (ws.username) {
      updateUserOnlineStatus(ws.username, false);
      console.log(`User ${ws.username} went offline`);
    }
  });
});

// === AUTHENTICATION UTILITIES ===

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and extracts user information
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

/**
 * Generate JWT token for authenticated user
 * @param {Object} user - User object containing username and other details
 * @returns {string} - Signed JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { username: user.username }, 
    process.env.JWT_SECRET || "secretkey", // Use env variable or fallback
    { expiresIn: "1h" }                    // Token expires in 1 hour
  );
}

// === API ENDPOINTS ===



/**
 * User Registration Endpoint
 * Creates new user accounts with hashed passwords
 */
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  
  // === INPUT VALIDATION ===
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  
  try {
    // === CHECK FOR EXISTING USER ===
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }
    
    // === PASSWORD HASHING ===
    // Hash password with bcrypt (10 rounds of salting)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // === CREATE USER ===
    await addUser({ username, password: hashedPassword });
    
    console.log(`New user registered: ${username}`);
    res.json({ message: "User registered successfully" });
    
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * User Login Endpoint
 * Authenticates users and returns JWT tokens
 */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // === USER LOOKUP ===
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    // === PASSWORD VERIFICATION ===
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    // === TOKEN GENERATION ===
    const token = generateToken(user);
    
    // Update user's last active time and online status
    updateUserOnlineStatus(username, true);
    
    console.log(`User logged in: ${username}`);
    res.json({ token });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Activity Stats API Endpoint
 * Returns real-time activity statistics
 */
app.get("/api/activity", authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    
    // Get current user's stats
    const currentUser = findUserByUsername(username);
    
    // Get pixel statistics
    const pixelStats = getPixelStats();
    
    // Get online user count
    const onlineUsers = wss.clients.size;
    
    // Get current user's rank
    const leaderboard = getAllUsersForLeaderboard();
    const userRank = leaderboard.findIndex(user => user.username === username) + 1;
    
    const activityData = {
      totalPixels: pixelStats?.total_pixels || 0,
      onlineUsers: onlineUsers,
      yourPixels: currentUser?.pixels_placed || 0,
      yourRank: userRank > 0 ? userRank : 'N/A',
      totalUsers: leaderboard.length,
      recentActivity: pixelStats?.latest_pixel_date || 'No activity yet'
    };
    
    res.json(activityData);
  } catch (error) {
    console.error("Activity stats error:", error);
    res.status(500).json({ error: "Failed to fetch activity data" });
  }
});

/**
 * Leaderboard API Endpoint
 * Returns leaderboard data with user statistics
 */
app.get("/api/leaderboard", authenticateToken, async (req, res) => {
  try {
    const rawData = getAllUsersForLeaderboard();
    
    // Convert snake_case to camelCase for frontend
    const leaderboardData = rawData.map(user => ({
      username: user.username,
      pixelsPlaced: user.pixels_placed,
      totalContributions: user.total_contributions,
      joinedAt: user.joined_at,
      lastActive: user.last_active,
      isOnline: user.is_online
    }));
    
    res.json(leaderboardData);
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard data" });
  }
});

/**
 * User Profile API Endpoint
 * Returns current user's statistics
 */
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await findUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return public user information
    res.json({
      username: user.username,
      pixelsPlaced: user.pixelsPlaced || 0,
      totalContributions: user.totalContributions || 0,
      joinedAt: user.joinedAt,
      lastActive: user.lastActive,
      isOnline: user.isOnline || false
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});


// Fallback: serve index.html for any unknown route (for React Router)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// === SERVER STARTUP ===

// Get port from environment variable or use default
const PORT = process.env.PORT || 5000;

/**
 * Initialize and start the server
 * Sets up database connection then starts HTTP and WebSocket servers
 */
try {
  initDB();
  
  // Load existing pixels from database after initialization
  console.log('Loading pixels from database...');
  try {
    gridState = loadAllPixels();
    const pixelCount = Object.keys(gridState).length;
    console.log(`✅ Loaded ${pixelCount} pixels from database`);
  } catch (error) {
    console.error('❌ Error loading pixels:', error);
    gridState = {}; // Start with empty grid if loading fails
  }
  
  server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 WebSocket server running on port ${PORT}`);
    console.log(`🌐 Frontend should connect to: http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("❌ Failed to initialize database:", error);
  process.exit(1);
}