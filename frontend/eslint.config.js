// Import ESLint's JavaScript configuration presets
import js from '@eslint/js'
// Import global variable definitions for different environments
import globals from 'globals'
// Import React Hooks specific linting rules
import reactHooks from 'eslint-plugin-react-hooks'
// Import React Refresh plugin for development hot reloading checks
import reactRefresh from 'eslint-plugin-react-refresh'
// Import ESLint configuration helper functions
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * ESLint Configuration File
 * Defines code quality and style rules for JavaScript/JSX files
 * Includes React-specific rules and best practices
 */
export default defineConfig([
  // Global ignore patterns - files/directories to exclude from linting
  globalIgnores(['dist']), // Ignore build output directory
  
  {
    // Target files: JavaScript and JSX files throughout the project
    files: ['**/*.{js,jsx}'],
    
    // Extend from recommended configuration sets
    extends: [
      js.configs.recommended,                    // ESLint's recommended JavaScript rules
      reactHooks.configs['recommended-latest'],  // React Hooks best practices
      reactRefresh.configs.vite,                 // Vite-specific React Refresh rules
    ],
    
    // Language parsing and environment options
    languageOptions: {
      ecmaVersion: 2020,           // ECMAScript version to parse
      globals: globals.browser,    // Browser global variables (window, document, etc.)
      parserOptions: {
        ecmaVersion: 'latest',     // Use latest ECMAScript features
        ecmaFeatures: { jsx: true }, // Enable JSX parsing
        sourceType: 'module',      // Enable ES6 module syntax
      },
    },
    
    // Custom rule overrides and additions
    rules: {
      // Allow unused variables that start with uppercase or underscore
      // Useful for React components and private variables
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
