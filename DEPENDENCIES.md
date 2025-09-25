# Project Dependencies Documentation

This document explains all the dependencies used in the pixel art collaborative application.

## Root Package Dependencies

### Production Dependencies
- **bcrypt** (^6.0.0) - Password hashing for secure authentication
- **jsonwebtoken** (^9.0.2) - JWT token generation and verification
- **sqlite** (^5.1.1) - Promise-based SQLite wrapper
- **sqlite3** (^5.1.7) - SQLite database driver
- **stripe** (^18.5.0) - Payment processing integration
- **ws** (^8.18.3) - WebSocket server for real-time communication

## Frontend Dependencies

### Production Dependencies
- **@stripe/react-stripe-js** (^4.0.2) - Stripe React components for payment UI
- **@stripe/stripe-js** (^7.9.0) - Stripe JavaScript SDK for client-side payment processing
- **axios** (^1.12.1) - HTTP client for making API requests to the backend
- **react** (^19.1.1) - React library for building user interface components
- **react-dom** (^19.1.1) - React DOM rendering for web applications

### Development Dependencies
- **@eslint/js** (^9.33.0) - ESLint JavaScript configuration presets
- **@types/react** (^19.1.10) - TypeScript type definitions for React
- **@types/react-dom** (^19.1.7) - TypeScript type definitions for ReactDOM
- **@vitejs/plugin-react** (^5.0.0) - Vite plugin for React support (JSX, Fast Refresh)
- **eslint** (^9.33.0) - JavaScript linter for code quality and style enforcement
- **eslint-plugin-react-hooks** (^5.2.0) - ESLint rules for React Hooks best practices
- **eslint-plugin-react-refresh** (^0.4.20) - ESLint rules for React Fast Refresh
- **globals** (^16.3.0) - Global variable definitions for different environments
- **vite** (^7.1.2) - Fast build tool and development server

## Backend Dependencies

### Production Dependencies
- **cors** (^2.8.5) - Cross-Origin Resource Sharing middleware for Express
- **dotenv** (^17.2.2) - Environment variable loader from .env files
- **express** (^5.1.0) - Fast, unopinionated web framework for Node.js
- **sqlite3** (^5.1.6) - SQLite database driver for Node.js
- **sqlite** (^5.1.6) - Promise-based SQLite wrapper for easier async operations
- **stripe** (^12.19.0) - Stripe SDK for server-side payment processing

### Development Dependencies
- **nodemon** (^3.1.10) - Development tool that automatically restarts the server on file changes

## Scripts Documentation

### Root Package Scripts
- **dev** - Runs both frontend and backend in development mode simultaneously
- **dev:frontend** - Starts only the frontend development server
- **dev:backend** - Starts only the backend development server with auto-restart
- **build** - Builds the frontend for production deployment
- **start** - Starts the backend server in production mode

### Frontend Scripts
- **dev** - Starts Vite development server with hot reload
- **build** - Builds optimized production bundle
- **lint** - Runs ESLint to check code quality
- **preview** - Previews the production build locally

### Backend Scripts
- **dev** - Starts server with nodemon for development (auto-restart on changes)
- **start** - Starts server in production mode with node

## Technology Stack Summary

- **Frontend**: React 19 + Vite + TypeScript support
- **Backend**: Node.js + Express + WebSocket
- **Database**: SQLite for user management
- **Authentication**: JWT tokens + bcrypt password hashing
- **Payments**: Stripe integration (both client and server-side)
- **Real-time**: WebSocket for collaborative pixel placement
- **Development**: ESLint for code quality, Nodemon for auto-restart