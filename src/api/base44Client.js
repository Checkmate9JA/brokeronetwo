import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68ad67abfba2e0747cb1f62c", 
  requiresAuth: true // Ensure authentication is required for all operations
});
