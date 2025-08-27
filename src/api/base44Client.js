import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Debug environment variables
console.log('Environment variables:', {
  VITE_BASE44_APP_ID: import.meta.env.VITE_BASE44_APP_ID,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE
});

// Create a client with authentication required
export const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID,
  requiresAuth: true, // Ensure authentication is required for all operations
  // Add local development configuration
  ...(import.meta.env.DEV && {
    // Override any production redirects for local development
    baseURL: window.location.origin,
    redirectURL: window.location.origin
  })
});
