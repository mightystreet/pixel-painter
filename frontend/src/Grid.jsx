// Import React hooks for component state management and lifecycle
import React, { useRef, useEffect, useState, useMemo } from "react";
import "./Grid.css";                    // Grid-specific styles
import { useState as useLocalState } from "react";  // Alias for additional state hooks

// Import custom components for grid functionality
import ColorPicker from "./ColorPicker";          // Color selection interface
import Timer from "./Timer";                      // Cooldown timer display
import FullscreenButton from "./FullscreenButton"; // Button to enter fullscreen mode
import GridCanvas from "./GridCanvas";            // Main canvas rendering component
import { getUsernameFromToken } from "./App";     // Import utility to get username from JWT

/**
 * Grid Component - Main pixel art canvas interface
 * Handles real-time collaborative pixel placement with WebSocket communication
 * Features: zooming, panning, color selection, payment system, cooldown timers
 * 
 * @param {number} cellSize - Size of each pixel cell in pixels (default: 20)
 * @param {number} canvasSize - Canvas dimensions in pixels (default: 720)
 * @param {function} onPixelPlaced - Callback function called when a pixel is successfully placed
 */
function Grid({ cellSize = 20, canvasSize = 720, onPixelPlaced }) {
  // === USER AUTHENTICATION ===
  // Get username from JWT token stored in localStorage
  const token = localStorage.getItem("token") || "";
  const username = getUsernameFromToken(token) || "guest";
  
  // === CONFIRMATION POPUP STATE ===
  // State for placement confirmation dialog
  const [confirmPlace, setConfirmPlace] = useState({ 
    open: false,        // Whether popup is visible
    col: null,         // Grid column being placed
    row: null,         // Grid row being placed
    key: null,         // Grid key string "col,row"
    usedPurchased: false // Whether using a purchased square bypass
  });
  
  // === VISUAL FEEDBACK STATE ===
  // Flicker state for confirm square visual effect
  const [flicker, setFlicker] = useState(true);
  
  // Effect to create flickering animation for placement confirmation
  useEffect(() => {
    if (!confirmPlace.open) return;
    setFlicker(true);
    const interval = setInterval(() => setFlicker(f => !f), 350);
    return () => clearInterval(interval);
  }, [confirmPlace.open]);
  
  // === PAYMENT SYSTEM STATE ===
  // Payment popup state for overriding existing pixels
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingCell, setPendingCell] = useState(null); // Cell awaiting payment
  
  // === CANVAS AND INTERACTION STATE ===
  const canvasRef = useRef(null);      // Reference to HTML5 canvas element
  const containerRef = useRef(null);   // Reference to fullscreen container
  
  // Pan/drag state for moving around the grid
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Current pan offset
  const [drag, setDrag] = useState(null);               // Active drag operation
  
  // === DRAWING MODE STATE ===
  const [colorMode, setColorMode] = useState(false);    // Whether in pixel placement mode
  const [color, setColor] = useState("#ff0000");        // User's selected color (unique per user)
  
  // === GRID DATA STATE ===
  const [pixels, setPixels] = useState({});             // Grid state: {"x,y": color}
  
  // === HOVER TOOLTIP STATE ===
  const [hoveredCellInfo, setHoveredCellInfo] = useState(null); // Information about hovered cell in fullscreen
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // Tooltip position (aligned to cell)
  const [hoverTooltipEnabled, setHoverTooltipEnabled] = useState(false); // Whether hover tooltip is enabled
  
  // === WEBSOCKET CONNECTION ===
  const wsRef = useRef(null);                           // WebSocket connection reference
  
  // === PURCHASE SYSTEM ===
  // Calculate how many squares the user has purchased (by counting their color)
  const purchasedCount = useMemo(() => {
    return Object.values(pixels).filter((pixelData) => {
      const pixelColor = typeof pixelData === 'string' ? pixelData : pixelData.color;
      return pixelColor === color;
    }).length;
  }, [pixels, color]);

  // === MULTIPLAYER WEBSOCKET CONNECTION ===
  // Connect to WebSocket server for real-time collaborative editing
  useEffect(() => {
  // Connect to backend WebSocket server
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsHost = import.meta.env.DEV ? "localhost:5000" : window.location.host;
  const ws = new window.WebSocket(`${wsProtocol}//${wsHost}`);
    wsRef.current = ws;
    
    // WebSocket connection opened successfully
    ws.onopen = () => {
      // Authenticate user with the WebSocket server
      if (username && username !== "guest") {
        ws.send(JSON.stringify({
          type: "authenticate",
          username: username
        }));
      }
      console.log("Connected to WebSocket server");
    };
    
    // Handle incoming messages from server
    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) { 
        console.error("Failed to parse WebSocket message:", e);
        return; 
      }
      
      // Handle initial grid state from server
      if (data.type === "init" && data.grid) {
        // Store both color and username information from server
        const fullGrid = {};
        for (const [key, value] of Object.entries(data.grid)) {
          if (typeof value === "string") {
            // Legacy format: just color
            fullGrid[key] = { color: value, username: null };
          } else {
            // New format: { color, username }
            fullGrid[key] = { color: value.color, username: value.username };
          }
        }
        setPixels(fullGrid);
      } 
      // Handle real-time cell updates from other users
      else if (data.type === "cellUpdate" && data.key && data.color) {
        setPixels(prev => {
          // Prevent overwriting existing pixels (first-come-first-served)
          if (prev[data.key]) return prev;
          return { 
            ...prev, 
            [data.key]: { 
              color: data.color, 
              username: data.username || null 
            } 
          };
        });
      }
    };
    
    // Handle WebSocket connection closure
    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
      // Optionally: show disconnected UI or attempt reconnection
    };
    
    // Cleanup: close WebSocket when component unmounts
    return () => { ws.close(); };
  }, []);
  
  // === DEVELOPMENT/TESTING STATE ===
  // For dev/test payment button functionality
  const [devPaymentCount, setDevPaymentCount] = useLocalState(0);
  
  // === UI INTERACTION STATE ===
  // For keyboard-controlled cell selection functionality
  const [selectedCell, setSelectedCell] = useState({ col: 18, row: 18 }); // Start near center of typical 36x36 grid
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // === COOLDOWN TIMER STATE ===
  const [lastColorTime, setLastColorTime] = useState(null); // Timestamp of last pixel placement
  const [now, setNow] = useState(Date.now());               // Current time for timer calculations
  
  // === ZOOM FUNCTIONALITY ===
  const [zoom, setZoom] = useState(1);  // Zoom level: 1 = 100%, 0.5 = 50%, 2 = 200%
  const minZoom = 0.2;                  // Minimum zoom level (20%)
  const maxZoom = 2.5;                  // Maximum zoom level (250%)
  
  // === SCROLL PREVENTION ===
  // Prevent browser scroll when mouse wheel is used over the grid
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Prevent default scroll behavior on wheel events
    function preventScroll(e) {
      e.preventDefault();
    }
    
    container.addEventListener("wheel", preventScroll, { passive: false });
    return () => {
      container.removeEventListener("wheel", preventScroll);
    };
  }, []);
  
  /**
   * Mouse wheel zoom handler
   * Zooms in/out while keeping the cell under the mouse cursor fixed in place
   * @param {WheelEvent} e - Mouse wheel event
   */
  function onWheel(e) {
    // Only zoom if ctrl is NOT pressed (ctrl+wheel = browser zoom)
    if (e.ctrlKey) return;
    e.preventDefault();
    
    const delta = e.deltaY;
    let newZoom = zoom;
    
    // Calculate new zoom level
    if (delta > 0) {
      // Zoom out (mouse wheel down)
      newZoom = Math.max(minZoom, zoom * 0.9);
    } else {
      // Zoom in (mouse wheel up) 
      newZoom = Math.min(maxZoom, zoom * 1.1);
    }
    
    // === ZOOM TO CURSOR LOGIC ===
    // Keep the cell under the mouse cursor fixed during zoom
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;  // Mouse X relative to canvas
    const my = e.clientY - rect.top;   // Mouse Y relative to canvas
    
    // Account for canvas CSS scaling
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    // Mouse position in canvas coordinates
    const x = mx * scaleX;
    const y = my * scaleY;
    
    // Convert to world coordinates (before zoom)
    const worldX = (x + offset.x) / zoom;
    const worldY = (y + offset.y) / zoom;
    
    // Find the cell under the mouse cursor
    const cellCol = Math.floor(worldX / cellSize);
    const cellRow = Math.floor(worldY / cellSize);
    
    // Calculate center of that cell in world coordinates
    const cellCenterX = (cellCol + 0.5) * cellSize;
    const cellCenterY = (cellRow + 0.5) * cellSize;
    
    // Calculate new offset to keep cell center under mouse
    // Formula: (cellCenterX * newZoom - newOffset.x) = x
    // Solving for newOffset: newOffset.x = cellCenterX * newZoom - x
    setOffset({
      x: cellCenterX * newZoom - x,
      y: cellCenterY * newZoom - y,
    });
    setZoom(newZoom);
  }

  // === TIMER UPDATE LOGIC ===
  // Update timer every second when in fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isFullscreen]);
  
  // === FULLSCREEN EXIT HANDLER ===
  function handleExitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
  // Listen for fullscreen state changes across different browsers
  useEffect(() => {
    /**
     * Handle fullscreen state changes
     * Updates isFullscreen state and exits color mode when leaving fullscreen
     */
    function handleChange() {
      const el = containerRef.current;
      const fs = document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.msFullscreenElement;
      
      setIsFullscreen(!!(el && fs === el));
      
      // Exit color mode if not in fullscreen
      if (!(el && fs === el)) setColorMode(false);
    }
    
    // Add event listeners for different browser fullscreen APIs
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    document.addEventListener("MSFullscreenChange", handleChange);
    
    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
      document.removeEventListener("MSFullscreenChange", handleChange);
    };
  }, []);

  // === KEYBOARD NAVIGATION ===
  // Listen for WASD and arrow key presses to move the selected cell
  useEffect(() => {
    /**
     * Handle keyboard navigation for cell selection
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyDown(e) {
      // Only handle navigation when in color mode
      if (!colorMode) return;
      
      let newCol = selectedCell.col;
      let newRow = selectedCell.row;
      
      // Handle different key combinations
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          newRow = selectedCell.row - 1;
          e.preventDefault();
          break;
        case 's':
        case 'arrowdown':
          newRow = selectedCell.row + 1;
          e.preventDefault();
          break;
        case 'a':
        case 'arrowleft':
          newCol = selectedCell.col - 1;
          e.preventDefault();
          break;
        case 'd':
        case 'arrowright':
          newCol = selectedCell.col + 1;
          e.preventDefault();
          break;
        case 'enter':
        case ' ':
          // Trigger placement at selected cell
          handleKeyboardPlacement();
          e.preventDefault();
          break;
        default:
          return;
      }
      
      // Update selected cell position
      setSelectedCell({ col: newCol, row: newRow });
    }
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [colorMode, selectedCell, lastColorTime, devPaymentCount, pixels, color]);

  /**
   * Handle pixel placement via keyboard (Enter or Space)
   */
  function handleKeyboardPlacement() {
    // === COOLDOWN AND BYPASS LOGIC ===
    const nowTime = Date.now();
    let canColor = true;
    let usedPurchased = false;
    
    // Check if user is still in cooldown period (5 seconds)
    if (lastColorTime && nowTime - lastColorTime < 5000) {
      // If user has purchased squares, allow bypass of cooldown
      if (devPaymentCount > 0) {
        // Mark for purchased square consumption (after confirmation)
        usedPurchased = true;
      } else {
        // Block placement due to cooldown
        canColor = false;
      }
    }
    
    if (!canColor) return;
    
    // Use the currently selected cell
    const col = selectedCell.col;
    const row = selectedCell.row;
    const key = `${col},${row}`;
    
    // === PLACEMENT LOGIC ===
    // If cell is empty, ask for confirmation before coloring
    if (!pixels[key]) {
      setConfirmPlace({ open: true, col, row, key, usedPurchased });
      return;
    }
    
    // If cell is filled by the current user, do nothing
    const pixelData = pixels[key];
    const pixelColor = typeof pixelData === 'string' ? pixelData : pixelData.color;
    if (pixelColor === color) {
      return;
    }
    
    // If cell is filled by another user, show payment UI for override
    setPendingCell({ col, row, key });
    setPaymentOpen(true);
  }

  /**
   * Handler to enter fullscreen mode
   * Uses different APIs for cross-browser compatibility
   */
  function handleFullscreen() {
    const el = containerRef.current;
    
    // Try different fullscreen APIs for browser compatibility
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
    
    // Reset timer UI when entering fullscreen
    setNow(Date.now());
  }

  /**
   * Development/testing payment handler
   * Simulates purchasing additional squares for bypassing cooldowns
   */
  function handleDevPayment() {
    setDevPaymentCount((c) => c + 1);
  }



  // === MOUSE INTERACTION HANDLERS ===
  
  /**
   * Mouse down handler - initiates either pixel placement or pan dragging
   * @param {MouseEvent} e - Mouse down event
   */
  function onMouseDown(e) {
    if (colorMode) {
      // In color mode: use keyboard navigation instead of mouse clicking
      // Mouse clicking is disabled in color mode - use WASD/arrows + Enter/Space
      return;
    } else {
      // In pan mode: start dragging to move the view
      setDrag({ 
        x: e.nativeEvent.offsetX, 
        y: e.nativeEvent.offsetY, 
        startOffset: { ...offset } 
      });
    }
  }
  
  /**
   * Mouse move handler - updates pan offset during drag operations
   * @param {MouseEvent} e - Mouse move event
   */
  function onMouseMove(e) {
    if (!drag) return;
    
    // Calculate drag distance
    const dx = e.nativeEvent.offsetX - drag.x;
    const dy = e.nativeEvent.offsetY - drag.y;
    
    // Update offset to pan the view
    setOffset({
      x: drag.startOffset.x - dx,
      y: drag.startOffset.y - dy,
    });
  }
  
  /**
   * Mouse up handler - ends drag operations
   */
  function onMouseUp() {
    setDrag(null);
  }

  /**
   * Handle mouse hover over cells in fullscreen mode
   * Shows tooltip with cell information
   * @param {MouseEvent} e - Mouse move event
   */
  function handleCellHover(e) {
    if (!isFullscreen || colorMode || !hoverTooltipEnabled) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Account for canvas CSS scaling
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    // Get mouse position relative to canvas
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Convert to world coordinates accounting for zoom and pan
    const worldX = (x + offset.x) / zoom;
    const worldY = (y + offset.y) / zoom;
    
    // Calculate grid cell coordinates
    const col = Math.floor(worldX / cellSize);
    const row = Math.floor(worldY / cellSize);
    const key = `${col},${row}`;
    
    // Get cell information
    const pixelData = pixels[key];
    const isEmpty = !pixelData;
    let cellColor, pixelOwner, isOwnedByUser;
    
    if (!isEmpty) {
      cellColor = typeof pixelData === 'string' ? pixelData : pixelData.color;
      pixelOwner = typeof pixelData === 'string' ? 'Unknown' : (pixelData.username || 'Unknown');
      isOwnedByUser = cellColor === color;
    }
    
    // Set hovered cell info
    // Set hovered cell info
    setHoveredCellInfo({
      col,
      row,
      key,
      isEmpty,
      isOwnedByUser: !isEmpty && isOwnedByUser,
      color: cellColor,
      owner: pixelOwner,
      coordinates: `(${col}, ${row})`
    });

    // Align tooltip to the hovered cell in the viewport
    // Align tooltip to the hovered cell in the viewport
    // Use the rect, scaleX, scaleY already declared above
    const cellCanvasX = (col * cellSize * zoom) - offset.x;
    const cellCanvasY = (row * cellSize * zoom) - offset.y;
    // Convert to viewport coordinates
    const cellScreenX = rect.left + cellCanvasX / scaleX;
    const cellScreenY = rect.top + cellCanvasY / scaleY;
    // Tooltip size and margin
    const tooltipWidth = 180;
    const tooltipHeight = 180;
    const margin = 10;
    // Default: show tooltip above the cell
    let tooltipX = cellScreenX;
    let tooltipY = cellScreenY - tooltipHeight - margin;
    // If not enough space above, show below
    if (tooltipY < margin) {
      tooltipY = cellScreenY + cellSize * zoom + margin;
    }
    // Clamp horizontally
    if (tooltipX + tooltipWidth > window.innerWidth) {
      tooltipX = window.innerWidth - tooltipWidth - margin;
    }
    if (tooltipX < margin) {
      tooltipX = margin;
    }
    // Clamp vertically
    if (tooltipY + tooltipHeight > window.innerHeight) {
      tooltipY = window.innerHeight - tooltipHeight - margin;
    }
    setTooltipPosition({
      x: tooltipX,
      y: tooltipY
    });
  }

  /**
   * Handle mouse leaving canvas - hide tooltip
   */
  function handleMouseLeave() {
    if (hoverTooltipEnabled) {
      setHoveredCellInfo(null);
    }
  }

  /**
   * Handle pixel placement when canvas is clicked in color mode
   * Manages cooldown logic, purchased square bypass, and confirmation popups
   * @param {MouseEvent} e - Mouse click event
   */
  function handleCanvasClick(e) {
    // === COOLDOWN AND BYPASS LOGIC ===
    const nowTime = Date.now();
    let canColor = true;
    let usedPurchased = false;
    
    // Check if user is still in cooldown period (5 seconds)
    if (lastColorTime && nowTime - lastColorTime < 5000) {
      // If user has purchased squares, allow bypass of cooldown
      if (devPaymentCount > 0) {
        // Mark for purchased square consumption (after confirmation)
        usedPurchased = true;
      } else {
        // Block placement due to cooldown
        canColor = false;
      }
    }
    
    if (!canColor) return;
    
    // === COORDINATE CALCULATION ===
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Account for canvas CSS scaling
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    // Get mouse position relative to canvas
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Convert to world coordinates accounting for zoom and pan
    const worldX = (x + offset.x) / zoom;
    const worldY = (y + offset.y) / zoom;
    
    // Calculate grid cell coordinates
    const col = Math.floor(worldX / cellSize);
    const row = Math.floor(worldY / cellSize);
    const key = `${col},${row}`;
    
    // === PLACEMENT LOGIC ===
    // If cell is empty, ask for confirmation before coloring
    if (!pixels[key]) {
      setConfirmPlace({ open: true, col, row, key, usedPurchased });
      return;
    }
    
    // If cell is filled by the current user, do nothing
    const pixelData = pixels[key];
    const pixelColor = typeof pixelData === 'string' ? pixelData : pixelData.color;
    if (pixelColor === color) {
      return;
    }
    
    // If cell is filled by another user, show payment UI for override
    setPendingCell({ col, row, key });
    setPaymentOpen(true);
  }

  /**
   * Handle confirmation dialog response for pixel placement
   * @param {boolean} confirmed - Whether user confirmed the placement
   */
  function handleConfirmPlace(confirmed) {
    if (!confirmPlace.open) return;
    
    if (confirmed) {
      // === OPTIMISTIC UPDATE ===
      // Update grid immediately for responsive UI
      setPixels(prev => {
        // Prevent overwriting if someone else placed a pixel meanwhile
        if (prev[confirmPlace.key]) return prev;
        return { ...prev, [confirmPlace.key]: color };
      });
      
      // === WEBSOCKET SYNC ===
      // Send placement to server for multiplayer sync
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({ 
          type: "colorCell", 
          key: confirmPlace.key, 
          color, 
          username 
        }));
        
        // Trigger leaderboard refresh after successful pixel placement
        if (onPixelPlaced) {
          onPixelPlaced();
        }
      }
      
      // === COOLDOWN MANAGEMENT ===
      const nowTime = Date.now();
      if (!confirmPlace.usedPurchased) {
        // Start cooldown timer for regular placement
        setLastColorTime(nowTime);
      } else {
        // Consume a purchased square (no cooldown)
        setDevPaymentCount(c => c - 1);
      }
    }
    
    // Reset confirmation dialog state
    setConfirmPlace({ open: false, col: null, row: null, key: null, usedPurchased: false });
  }
  
  /**
   * Handle successful payment for overriding existing pixels
   * Called when payment processing completes successfully
   */
  function handlePaymentSuccess() {
    if (!pendingCell) return;
    
    const nowTime = Date.now();
    
    // Update grid with new pixel and start cooldown
    setPixels(prev => {
      if (prev[pendingCell.key]) return prev;
      const updated = { ...prev, [pendingCell.key]: color };
      setLastColorTime(nowTime);
      return updated;
    });
    
    // Close payment UI and clear pending state
    setPaymentOpen(false);
    setPendingCell(null);
  }

  // === TIMER LOGIC ===
  // Calculate remaining cooldown time
  let timeLeft = 0;
  if (lastColorTime) {
    timeLeft = 5000 - (now - lastColorTime); // 5 second cooldown
    if (timeLeft < 0) timeLeft = 0;
  }
  
  /**
   * Format milliseconds into HH:MM:SS time string
   * @param {number} ms - Milliseconds to format
   * @returns {string} - Formatted time string
   */
  function formatTime(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // === COMPONENT RENDER ===
  return (
    <div ref={containerRef} className="fullscreen-grid grid-container" style={{ padding: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>

      {/* === CONFIRMATION DIALOG === */}
      {/* Modal popup for confirming pixel placement */}
      {confirmPlace.open && (
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.35)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#5757573d", borderRadius: 12, padding: 32, minWidth: 320, boxShadow: "0 2px 16px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ marginBottom: 16 }}>Confirm Placement</h3>
            <div style={{ marginBottom: 24 }}>Are you sure you want to place a square at <b>({confirmPlace.col}, {confirmPlace.row})</b>?</div>
            <div style={{ display: "flex", gap: 16 }}>
              {/* Confirm button */}
              <button onClick={() => handleConfirmPlace(true)} style={{ background: "#635bff", color: "#fff", border: "none", borderRadius: 6, padding: "10px 24px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Yes</button>
              {/* Cancel button */}
              <button onClick={() => handleConfirmPlace(false)} style={{ background: "#eee", color: "#333", border: "none", borderRadius: 6, padding: "10px 24px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>No</button>
            </div>
          </div>
        </div>
      )}
      
      {/* === MAIN CANVAS COMPONENT === */}
      {/* GridCanvas handles all the actual drawing and rendering */}
      <GridCanvas
        canvasRef={canvasRef}
        canvasSize={canvasSize}
        cellSize={cellSize}
        zoom={zoom}
        offset={offset}
        pixels={pixels}
        colorMode={colorMode}
        drag={drag}
        timeLeft={timeLeft}
        hoveredCell={colorMode ? selectedCell : null}
        confirmFlicker={confirmPlace.open && flicker ? { col: confirmPlace.col, row: confirmPlace.row, color } : null}
        onMouseDown={onMouseDown}
        onMouseMove={e => {
          onMouseMove(e);
          if (!colorMode) {
            handleCellHover(e);
          }
        }}
        onMouseUp={onMouseUp}
        onMouseLeave={e => {
          handleMouseLeave();
        }}
        onWheel={onWheel}
      />
      
      {/* === FULLSCREEN UI ELEMENTS === */}
      {/* Color picker, timer, and controls only visible in fullscreen mode */}
      {isFullscreen && (
        <>
          {/* === PURCHASED SQUARES COUNTER === */}
          {/* Display user's owned pixels and dev payment count */}
          <div style={{
            position: "absolute",
            right: 24,
            top: 148,
            width: 90,
            height: 90,
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            borderRadius: 10,
            fontSize: 13,
            fontFamily: "monospace",
            zIndex: 20,
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 0
          }}>
            {/* Count of pixels owned by this user */}
            <div>Squares: {purchasedCount}</div>
            {/* Development payment counter */}
            <div style={{ fontSize: 11, marginTop: 6, color: "#ffe066" }}>Dev Paid: {devPaymentCount}</div>
          </div>
          
          {/* === COLOR MODE TOGGLE BUTTON === */}
          {/* Button to enter/exit pixel placement mode */}
          <button
            className="pixel-colour-btn"
            onClick={() => {
              if (!colorMode) {
                // When entering color mode, position the selected cell at the current viewport center
                const canvas = canvasRef.current;
                if (canvas) {
                  const rect = canvas.getBoundingClientRect();
                  const canvasWidth = canvas.width;
                  const canvasHeight = canvas.height;
                  
                  // Calculate center of viewport in canvas coordinates
                  const viewportCenterX = canvasWidth / 2;
                  const viewportCenterY = canvasHeight / 2;
                  
                  // Convert viewport center to world coordinates
                  const worldX = (viewportCenterX + offset.x) / zoom;
                  const worldY = (viewportCenterY + offset.y) / zoom;
                  
                  // Calculate which cell is at the viewport center
                  const centerCol = Math.floor(worldX / cellSize);
                  const centerRow = Math.floor(worldY / cellSize);
                  
                  // Set the selected cell to the center of the current view
                  setSelectedCell({ col: centerCol, row: centerRow });
                }
              }
              setColorMode(m => !m);
            }}
            title={timeLeft === 0 ? "Add Pixel Colour" : `Wait ${formatTime(timeLeft)} to color again`}
            disabled={timeLeft > 0}
            style={{
              position: "absolute", 
              bottom: 16, 
              right: 80, 
              background: colorMode ? color : "rgba(255,255,255,0.9)", 
              border: colorMode ? `2px solid #333` : "none", 
              borderRadius: "50%", 
              width: 48, 
              height: 48, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", 
              cursor: timeLeft === 0 ? "pointer" : "not-allowed", 
              zIndex: 10, 
              opacity: timeLeft === 0 ? 1 : 0.5
            }}
          >
            {/* Palette icon SVG */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="8.5" cy="10.5" r="1.5"/>
              <circle cx="15.5" cy="10.5" r="1.5"/>
              <circle cx="12" cy="15.5" r="1.5"/>
            </svg>
          </button>
          
          {/* === HOVER TOOLTIP TOGGLE BUTTON === */}
          {/* Button to toggle hover tooltip functionality */}
          <button
            className="hover-tooltip-btn"
            onClick={() => setHoverTooltipEnabled(prev => !prev)}
            title={hoverTooltipEnabled ? "Disable hover tooltips" : "Enable hover tooltips"}
            style={{
              position: "absolute", 
              bottom: 16, 
              right: 136, 
              background: hoverTooltipEnabled ? "rgba(255, 230, 102, 0.9)" : "rgba(255,255,255,0.9)", 
              border: hoverTooltipEnabled ? `2px solid #333` : "none", 
              borderRadius: "50%", 
              width: 48, 
              height: 48, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", 
              cursor: "pointer", 
              zIndex: 10,
              transition: "all 0.2s ease"
            }}
          >
            {/* Info/tooltip icon SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"/>
              <path d="m12,17h0"/>
            </svg>
          </button>
          
          {/* === COLOR PICKER COMPONENT === */}
          {/* Color selection interface (visible when colorMode is true) */}
          <ColorPicker color={color} setColor={setColor} visible={colorMode} />
          
          {/* === KEYBOARD NAVIGATION INSTRUCTIONS === */}
          {/* Show instructions when in color mode */}
          {colorMode && (
            <div style={{
              position: "absolute",
              right: 80,
              bottom: 130,
              background: "rgba(0,0,0,0.8)",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              fontFamily: "monospace",
              zIndex: 20,
              maxWidth: 200,
              maxHeight: 200,
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: 3 }}>Keyboard Navigation:</div>
              <div>WASD or Arrow Keys: Move</div>
              <div>Enter or Space: Place pixel</div>
              <div style={{ marginTop: 2, fontSize: 10, opacity: 0.8 }}>
                Selected: ({selectedCell.col}, {selectedCell.row})
              </div>
            </div>
          )}
          
          {/* === HOVER TOOLTIP STATUS === */}
          {/* Show status when hover tooltips are enabled - REMOVED */}
          
          {/* === COOLDOWN TIMER === */}
          {/* 24-hour format timer display */}
          <Timer timeLeft={timeLeft} formatTime={formatTime} />
          
          {/* === DEVELOPMENT BUTTONS === */}
          {/* Test payment button for development */}
          <button
            style={{ 
              position: "absolute", 
              left: 24, 
              top: 24, 
              zIndex: 200, 
              background: "#ffe066", 
              color: "#333", 
              border: "1px solid #ccc", 
              borderRadius: 8, 
              padding: "10px 18px", 
              fontWeight: 700, 
              fontSize: 16, 
              cursor: "pointer", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)" 
            }}
            onClick={handleDevPayment}
          >
            Test Stripe Payment Development
          </button>
          
          {/* Stripe payment link for production testing */}
          <p>
            <a 
              href="https://buy.stripe.com/test_00wdR87f94c5flq3K1bjW00" 
              style={{ 
                position: "absolute", 
                left: 24, 
                top: 124, 
                zIndex: 200, 
                background: "#ffe066", 
                color: "#333", 
                border: "1px solid #ccc", 
                borderRadius: 8, 
                padding: "10px 18px", 
                fontWeight: 700, 
                fontSize: 16, 
                cursor: "pointer", 
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)" 
              }}
            >
              Buy 100 Squares!
            </a>
          </p>

        </>
      )}
      
      {/* === HOVER TOOLTIP === */}
      {/* Show cell information when hovering in fullscreen mode */}
      {isFullscreen && hoveredCellInfo && !colorMode && hoverTooltipEnabled && (
        <div style={{
          position: "fixed",
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          width: 180,
          height: 180,
          background: "rgba(0, 0, 0, 0.92)",
          color: "#fff",
          borderRadius: 12,
          padding: "14px 14px 10px 14px",
          fontSize: 12,
          fontFamily: "monospace",
          zIndex: 1000,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
          pointerEvents: "none", // Don't interfere with mouse events
          border: "1.5px solid rgba(255, 255, 255, 0.18)",
          animation: "fadeIn 0.2s ease-out",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          overflow: "hidden"
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-5px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div style={{ fontWeight: "bold", marginBottom: 8, color: "#ffe066" }}>
            Cell Information
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>Position:</strong> {hoveredCellInfo.coordinates}
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>Status:</strong> {hoveredCellInfo.isEmpty ? "Empty" : "Occupied"}
          </div>
          {!hoveredCellInfo.isEmpty && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Color:</strong> 
                <span style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  backgroundColor: hoveredCellInfo.color,
                  marginLeft: 8,
                  marginRight: 8,
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: 2,
                  verticalAlign: "middle"
                }}></span>
                {hoveredCellInfo.color}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Owner:</strong> {hoveredCellInfo.isOwnedByUser ? "You" : hoveredCellInfo.owner}
              </div>
            </>
          )}
          {hoveredCellInfo.isEmpty && (
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4, color: "#90EE90" }}>
              ✨ Available - Click to place your pixel here
            </div>
          )}
          {!hoveredCellInfo.isEmpty && hoveredCellInfo.isOwnedByUser && (
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4, color: "#ffe066" }}>
              ⭐ This is your pixel
            </div>
          )}
        </div>
      )}
      
      {/* === FULLSCREEN TOGGLE BUTTON === */}
      {/* Button enters or exits fullscreen depending on state */}
      <FullscreenButton 
        onClick={isFullscreen ? handleExitFullscreen : handleFullscreen}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}

// Export Grid component as default export
export default Grid;
