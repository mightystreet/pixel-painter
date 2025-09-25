// Import Vite's configuration helper function
import { defineConfig } from 'vite'
// Import React plugin for Vite to handle JSX and React features
import react from '@vitejs/plugin-react'

/**
 * Vite Configuration File
 * Configures the build tool and development server settings
 * Official documentation: https://vite.dev/config/
 */
export default defineConfig({
  plugins: [
    react() // Enable React support with JSX transformation and Fast Refresh
  ],
  server: {
    // Development server configuration
    port: 5173,
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy other backend routes (register, login, etc.)
      '/register': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
