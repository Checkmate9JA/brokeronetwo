import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Debug environment variables
console.log('Environment variables:', {
  VITE_BASE44_APP_ID: import.meta.env.VITE_BASE44_APP_ID,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE
});

// TEMPORARY: Disable Base44 SDK for local development to prevent redirects
let base44;

if (import.meta.env.DEV) {
  console.log('🔧 LOCAL DEV MODE: Creating mock Base44 client to prevent redirects');
  base44 = {
    auth: {
      me: async () => ({ id: 'local-dev-user', email: 'dev@localhost' }),
      signIn: async () => ({ user: { id: 'local-dev-user' } }),
      signUp: async () => ({ user: { id: 'local-dev-user' } }),
      signOut: async () => ({})
    },
    entities: {
      Transaction: { find: async () => [], create: async () => ({}) },
      InvestmentPlan: { find: async () => [], create: async () => ({}) },
      ExpertTrader: { find: async () => [], create: async () => ({}) },
      Trade: { find: async () => [], create: async () => ({}) },
      WalletSubmission: { find: async () => [], create: async () => ({}) },
      PaymentSetting: { find: async () => [], create: async () => ({}) },
      ManagedWallet: { find: async () => [], create: async () => ({}) },
      AdminSetting: { find: async () => [], create: async () => ({}) },
      UserInvestment: { find: async () => [], create: async () => ({}) },
      TradingInstrument: { find: async () => [], create: async () => ({}) },
      TradingSymbol: { find: async () => [], create: async () => ({}) },
      TradingPosition: { find: async () => [], create: async () => ({}) },
      ChatSetting: { find: async () => [], create: async () => ({}) }
    },
    integrations: {
      Core: {
        InvokeLLM: async () => ({ response: 'Local dev mode' }),
        SendEmail: async () => ({ success: true }),
        UploadFile: async () => ({ url: 'local-file-url' }),
        GenerateImage: async () => ({ url: 'local-image-url' }),
        ExtractDataFromUploadedFile: async () => ({ data: 'local-data' })
      }
    }
  };
} else {
  // Production: Use real Base44 SDK
  base44 = createClient({
    appId: import.meta.env.VITE_BASE44_APP_ID,
    requiresAuth: true
  });
}

export { base44 };
