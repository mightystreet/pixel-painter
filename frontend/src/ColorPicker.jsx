// Import React for component creation
import React from "react";

/**
 * ColorPicker Component - Color selection interface
 * Renders an HTML5 color input for users to select their pixel color
 * Only visible when the visible prop is true
 * 
 * @param {string} color - Current selected color value (hex format)
 * @param {Function} setColor - Callback to update the selected color
 * @param {boolean} visible - Whether the color picker should be displayed
 */
function ColorPicker({ color, setColor, visible }) {
  // Don't render anything if not visible
  if (!visible) return null;
  
  return (
    <input
      type="color"                              // HTML5 color input type
      value={color}                             // Current color value
      onChange={e => setColor(e.target.value)}  // Update color on change
      style={{
        position: "absolute",                   // Position absolutely on screen
        bottom: 80,                            // Distance from bottom
        right: 80,                             // Distance from right
        width: 40,                             // Picker width
        height: 40,                            // Picker height
        border: "none",                        // Remove default border
        borderRadius: "50%",                   // Make circular
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)", // Add shadow effect
        zIndex: 11,                            // Layer above other elements
        cursor: "pointer",                     // Show pointer cursor on hover
        padding: 0                             // Remove default padding
      }}
      title="Pick Colour"                      // Tooltip text
    />
  );
}

// Export ColorPicker component as default export
export default ColorPicker;
