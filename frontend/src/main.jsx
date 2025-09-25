// Import React's StrictMode for additional development checks
import { StrictMode } from 'react'
// Import createRoot for React 18's new root API
import { createRoot } from 'react-dom/client'
// Import global CSS styles
import './index.css'
// Import the main App component
import App from './App.jsx'

/**
 * Application Entry Point
 * This file initializes the React application and mounts it to the DOM
 * Uses React 18's createRoot API for improved performance and features
 */

// Create React root and render the application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* StrictMode enables additional development-time checks and warnings */}
    <App />
  </StrictMode>,
)
