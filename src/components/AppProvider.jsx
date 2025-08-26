
import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentApp, setCurrentApp] = useState('app1'); // Default to App 1

  useEffect(() => {
    // Load saved app preference from localStorage
    const savedApp = localStorage.getItem('selected_app');
    console.log('Loading saved app from localStorage:', savedApp);
    if (savedApp && (savedApp === 'app1' || savedApp === 'app2')) {
      setCurrentApp(savedApp);
    }
  }, []);

  const switchToApp = (appId) => {
    console.log('Switching to app:', appId);
    setCurrentApp(appId);
    localStorage.setItem('selected_app', appId);
  };

  const getAppConfig = () => {
    console.log('Getting app config for:', currentApp);
    if (currentApp === 'app2') {
      return {
        id: 'app2',
        name: 'Advance Investment Protection Platform',
        subtitle: 'Shield your crypto assets',
        icon: 'Shield',
        features: {
          showWalletCards: false,
          showInvestmentPlans: false,
          showTrading: false,
          showTransfers: false,
          showAccountBalance: true,
          showAddFunds: true,
          showWithdrawFunds: true,
          showConnectWallet: true
        }
      };
    }
    
    // Default App 1
    return {
      id: 'app1', 
      name: 'Advance Investment Platform',
      subtitle: 'Manage your investments and trading',
      icon: 'Crown',
      features: {
        showWalletCards: true,
        showInvestmentPlans: true,
        showTrading: true,
        showTransfers: true,
        showAccountBalance: false,
        showAddFunds: false,
        showWithdrawFunds: true,
        showConnectWallet: true
      }
    };
  };

  const appConfig = getAppConfig();
  
  console.log('Current app config:', appConfig);

  return (
    <AppContext.Provider value={{
      currentApp,
      switchToApp,
      appConfig
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
