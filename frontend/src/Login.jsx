// Import React and useState hook for form state management
import React, { useState } from "react";

/**
 * Login Component - User authentication form
 * Handles user login with username/password and JWT token management
 * 
 * @param {Function} onLogin - Callback function called with JWT token on successful login
 */
export default function Login({ onLogin }) {
  // === FORM STATE MANAGEMENT ===
  const [username, setUsername] = useState("");    // Username input field
  const [password, setPassword] = useState("");    // Password input field  
  const [remember, setRemember] = useState(false); // Remember me checkbox state
  const [message, setMessage] = useState("");      // Status/error message display

  /**
   * Handle form submission and authentication
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setMessage("");     // Clear any previous messages
    
    try {
      // === API AUTHENTICATION REQUEST ===
      // Send login credentials to backend server
  const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      // Parse JSON response from server
      const data = await res.json();
      
      // === SUCCESS HANDLING ===
      if (res.ok && data.token) {
        setMessage("Login successful!");
        
        // Store token in localStorage if "Remember me" is checked
        if (remember) {
          localStorage.setItem("token", data.token);
        }
        
        // Call parent component's onLogin callback with JWT token
        onLogin && onLogin(data.token);
      } 
      // === ERROR HANDLING ===
      else {
        setMessage(data.error || "Login failed");
      }
    } catch (err) {
      // Handle network/connection errors
      setMessage("Error connecting to server");
    }
  };

  // === COMPONENT RENDER ===
  return (
    <form onSubmit={handleSubmit}>
      {/* Login form title */}
      <h2>Login</h2>
      
      {/* Username input field */}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      
      {/* Password input field */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      {/* Remember me checkbox */}
      <label style={{ display: "block", margin: "8px 0" }}>
        <input
          type="checkbox"
          checked={remember}
          onChange={e => setRemember(e.target.checked)}
        /> Remember me
      </label>
      
      {/* Submit button */}
      <button type="submit">Login</button>
      
      {/* Status/error message display */}
      {message && <div>{message}</div>}
    </form>
  );
}
