import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Function to check if current page should allow dark mode
  const shouldAllowDarkMode = (pathname) => {
    // Admin and Super Admin pages should NEVER have dark mode
    const adminPages = [
      '/AdminDashboard',
      '/AdminUsers', 
      '/AdminPendingDeposits',
      '/AdminPendingWithdrawals',
      '/AdminInvestmentPlans',
      '/AdminManageWallets',
      '/AdminEmailManagement',
      '/TradingManagement',
      '/SuperAdminDashboard',
      '/SuperAdashboard',
      '/SuperAdminSocialProof'
    ];
    
    // Check if current path contains any admin page
    return !adminPages.some(page => pathname.includes(page));
  };

  useEffect(() => {
    // Get current pathname from window.location since we can't use useLocation here
    const pathname = window.location.pathname;
    const allowDarkMode = shouldAllowDarkMode(pathname);
    
    // Update localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Only apply dark mode if it's allowed for the current page
    if (isDarkMode && allowDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Listen for route changes to update dark mode application
  useEffect(() => {
    const handleRouteChange = () => {
      const pathname = window.location.pathname;
      const allowDarkMode = shouldAllowDarkMode(pathname);
      
      if (isDarkMode && allowDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
