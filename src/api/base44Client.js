// TEMPORARILY DISABLED: Base44 SDK is causing redirects
// import { createClient } from '@base44/sdk';

// Debug environment variables
console.log('Environment variables:', {
  VITE_BASE44_APP_ID: import.meta.env.VITE_BASE44_APP_ID,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE
});

// Mock Base44 client to prevent redirects
const base44 = {
  auth: {
    me: async () => ({ id: 'mock-user', email: 'mock@localhost' }),
    signIn: async () => ({ user: { id: 'mock-user' } }),
    signUp: async () => ({ user: { id: 'mock-user' } }),
    signOut: async () => ({})
  },
  entities: {
    Transaction: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    InvestmentPlan: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    ExpertTrader: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    Trade: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    WalletSubmission: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    PaymentSetting: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    ManagedWallet: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    AdminSetting: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    UserInvestment: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    TradingInstrument: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    TradingSymbol: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    TradingPosition: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    },
    ChatSetting: { 
      find: async () => [], 
      create: async () => ({}),
      filter: async () => [],
      where: () => ({ filter: async () => [] })
    }
  },
  integrations: {
    Core: {
      InvokeLLM: async () => ({ response: 'Mock response' }),
      SendEmail: async () => ({ success: true }),
      UploadFile: async () => ({ url: 'mock-file-url' }),
      GenerateImage: async () => ({ url: 'mock-image-url' }),
      ExtractDataFromUploadedFile: async () => ({ data: 'mock-data' })
    }
  }
};

export { base44 };
