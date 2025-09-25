// Import React for component creation
import React from "react";

/**
 * Timer Component - Cooldown timer display
 * Shows remaining time until user can place another pixel
 * Only visible when there's time remaining (timeLeft > 0)
 * 
 * @param {number} timeLeft - Remaining cooldown time in milliseconds
 * @param {Function} formatTime - Function to format time into display string
 */
function Timer({ timeLeft, formatTime }) {
  // Don't render if no cooldown time remaining
  if (timeLeft <= 0) return null;
  
  return (
    <div style={{
      position: "absolute",                    // Position absolutely on screen
      right: 24,                              // Distance from right edge
      top: 24,                                // Distance from top edge
      width: 70,                              // Timer box width
      height: 70,                             // Timer box height
      background: "rgba(0,0,0,0.8)",          // Semi-transparent black background
      color: "#fff",                          // White text color
      borderRadius: 10,                       // Rounded corners
      fontSize: 13,                           // Base font size
      fontFamily: "monospace",                // Monospace font for consistent spacing
      zIndex: 20,                             // Layer above other elements
      textAlign: "center",                    // Center align text
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)", // Subtle shadow effect
      display: "flex",                        // Use flexbox layout
      flexDirection: "column",                // Stack elements vertically
      alignItems: "center",                   // Center horizontally
      justifyContent: "center",               // Center vertically
      padding: 0                              // Remove default padding
    }}>
      {/* Timer label text */}
      <span style={{fontSize: 10, opacity: 0.7, lineHeight: 1}}>Next</span>
      <span style={{fontSize: 10, opacity: 0.7, lineHeight: 1}}>color in</span>
      
      {/* Formatted countdown time display */}
      <span style={{fontSize: 18, fontWeight: 700, lineHeight: 1.2}}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}

// Export Timer component as default export
export default Timer;
