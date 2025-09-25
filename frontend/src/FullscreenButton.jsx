// Import React for component creation
import React from "react";

/**
 * FullscreenButton Component - Button to enter fullscreen mode
 * Renders a circular button with fullscreen icon to trigger fullscreen mode
 * 
 * @param {Function} onClick - Callback function called when button is clicked
 */
function FullscreenButton({ onClick, isFullscreen }) {
  return (
    <button 
      className="fullscreen-btn" 
      onClick={onClick} 
      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        background: "rgba(255,255,255,0.9)",
        border: "none",
        borderRadius: "50%",
        width: 48,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        cursor: "pointer",
        zIndex: 10
      }}
    >
      {isFullscreen ? (
        // SVG for exit fullscreen (contract icon)
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 9L5 5M5 5v4M5 5h4" />
          <path d="M15 9l4-4M19 5v4M19 5h-4" />
          <path d="M15 15l4 4M19 19h-4M19 19v-4" />
          <path d="M9 15l-4 4M5 19v-4M5 19h4" />
        </svg>
      ) : (
        // SVG for enter fullscreen (expand icon)
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
          <path d="M16 3h3a2 2 0 0 1 2 2v3"/>
          <path d="M8 21H5a2 2 0 0 1-2-2v-3"/>
          <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
        </svg>
      )}
    </button>
  );
}

// Export FullscreenButton component as default export
export default FullscreenButton;
