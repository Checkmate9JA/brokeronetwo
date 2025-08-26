import React, { createContext, useContext, useState, useEffect } from 'react';
import { InvokeLLM } from '@/api/integrations';

const LanguageContext = createContext();

const translations = {
  en: {
    // Common
    'loading': 'Loading...',
    'cancel': 'Cancel',
    'submit': 'Submit',
    'save': 'Save',
    'delete': 'Delete',
    'edit': 'Edit',
    'close': 'Close',
    'search': 'Search',
    'actions': 'Actions',
    'success': 'Success',
    'error': 'Error',
    'warning': 'Warning',
    
    // Dashboard
    'welcome': 'Welcome',
    'total_balance': 'Total Balance',
    'deposit_wallet': 'Deposit Wallet',
    'profit_wallet': 'Profit Wallet',
    'trading_wallet': 'Trading Wallet',
    'deposit_funds': 'Deposit Funds',
    'withdraw_funds': 'Withdraw Funds',
    'investment_plans': 'Investment Plans',
    'start_trading': 'Start Trading',
    'transactions': 'Transactions',
    'pending_transactions': 'Pending Transactions',
    
    // Admin
    'admin_dashboard': 'Admin Dashboard',
    'user_management': 'User Management',
    'total_users': 'Total Users',
    'pending_deposits': 'Pending Deposits',
    'pending_withdrawals': 'Pending Withdrawals',
    'manage_users': 'Manage Users',
    'credit_user': 'Credit User',
    'debit_user': 'Debit User',
    
    // Wallet
    'connect_wallet': 'Connect Wallet',
    'wallet_connected': 'Wallet Connected',
    'no_wallets_submitted': 'No wallets submitted',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [customTranslations, setCustomTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  const detectLanguage = () => {
    const browserLang = navigator.language.split('-')[0];
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
    return supportedLanguages.includes(browserLang) ? browserLang : 'en';
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language') || detectLanguage();
    setLanguage(savedLanguage);
  }, []);

  const translateText = async (text, targetLang) => {
    if (targetLang === 'en' || !text) return text;
    
    const cacheKey = `${text}_${targetLang}`;
    if (customTranslations[cacheKey]) {
      return customTranslations[cacheKey];
    }

    try {
      setIsTranslating(true);
      const response = await InvokeLLM({
        prompt: `Translate the following text to ${getLanguageName(targetLang)}. Return only the translated text, no explanations: "${text}"`,
        response_json_schema: {
          type: "object",
          properties: {
            translation: { type: "string" }
          }
        }
      });

      const translated = response.translation || text;
      setCustomTranslations(prev => ({
        ...prev,
        [cacheKey]: translated
      }));
      
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  const getLanguageName = (code) => {
    const names = {
      'es': 'Spanish',
      'fr': 'French', 
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic'
    };
    return names[code] || 'English';
  };

  const t = (key, fallback = null) => {
    return translations[language]?.[key] || fallback || key;
  };

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('app_language', newLang);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      changeLanguage,
      t,
      translateText,
      isTranslating,
      supportedLanguages: [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'it', name: 'Italiano' },
        { code: 'pt', name: 'Português' },
        { code: 'ru', name: 'Русский' },
        { code: 'zh', name: '中文' },
        { code: 'ja', name: '日本語' },
        { code: 'ko', name: '한국어' },
        { code: 'ar', name: 'العربية' }
      ]
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};