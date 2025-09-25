// Import React for component creation
import React from "react";

/**
 * FullscreenButton Component - Button to enter fullscreen mode
 * Renders a circular button with fullscreen icon to trigger fullscreen mode
 * 
 * @param {Function} onClick - Callback function called when button is clicked
 */
function FullscreenButton({ onClick }) {
  return (
    <button 
      className="fullscreen-btn" 
      onClick={onClick} 
      title="Fullscreen"                        // Tooltip text
      style={{
        position: "absolute",                   // Position absolutely on screen
        bottom: 16,                            // Distance from bottom
        right: 16,                             // Distance from right
        background: "rgba(255,255,255,0.9)",   // Semi-transparent white background
        border: "none",                        // Remove default border
        borderRadius: "50%",                   // Make circular
        width: 48,                             // Button width
        height: 48,                            // Button height
        display: "flex",                       // Use flexbox for centering
        alignItems: "center",                  // Center vertically
        justifyContent: "center",              // Center horizontally
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)", // Subtle shadow effect
        cursor: "pointer",                     // Show pointer cursor on hover
        zIndex: 10                             // Layer above other elements
      }}
    >
      {/* SVG fullscreen expand icon */}
      <svg 
        width="28" 
        height="28" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Corner expansion paths for fullscreen icon */}
        <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
        <path d="M16 3h3a2 2 0 0 1 2 2v3"/>
        <path d="M8 21H5a2 2 0 0 1-2-2v-3"/>
        <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
      </svg>
    </button>
  );
}

// Export FullscreenButton component as default export
export default FullscreenButton;
