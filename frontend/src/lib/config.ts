/**
 * Frontend configuration
 * Centralizes environment-specific values like API base URL
 */

export const config = {
  /**
   * Backend API base URL
   * In development: points to local Rust backend
   * In production: should point to deployed backend URL
   */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  /**
   * Auth token for backend requests
   * TODO: In production, implement proper token management
   */
  authToken: import.meta.env.VITE_AUTH_TOKEN || 'dev-token',
} as const
