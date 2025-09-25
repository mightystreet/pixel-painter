// Import React and useState hook for form state management
import React, { useState } from "react";

/**
 * Register Component - User registration form
 * Handles new user account creation with username/password
 * 
 * @param {Function} onRegister - Callback function called after successful registration
 */
export default function Register({ onRegister }) {
  // === FORM STATE MANAGEMENT ===
  const [username, setUsername] = useState("");  // Username input field
  const [password, setPassword] = useState("");  // Password input field
  const [message, setMessage] = useState("");    // Status/error message display

  /**
   * Handle form submission and user registration
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setMessage("");     // Clear any previous messages
    
    try {
      // === API REGISTRATION REQUEST ===
      // Send registration data to backend server
  const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      // Parse JSON response from server
      const data = await res.json();
      
      // === SUCCESS HANDLING ===
      if (res.ok) {
        setMessage("Registration successful!");
        // Call parent component's onRegister callback (typically switches to login)
        onRegister && onRegister();
      } 
      // === ERROR HANDLING ===
      else {
        setMessage(data.error || "Registration failed");
      }
    } catch (err) {
      // Handle network/connection errors
      setMessage("Error connecting to server");
    }
  };

  // === COMPONENT RENDER ===
  return (
    <form onSubmit={handleSubmit}>
      {/* Registration form title */}
      <h2>Register</h2>
      
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
      
      {/* Submit button */}
      <button type="submit">Register</button>
      
      {/* Status/error message display */}
      {message && <div>{message}</div>}
    </form>
  );
}
