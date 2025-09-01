import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_CURRENCY } from '@/utils/currencyUtils';

/**
 * Custom hook to get the current user's preferred currency
 * @returns {string} User's preferred currency code (defaults to USD)
 */
export const useUserCurrency = () => {
  const { userProfile } = useAuth();
  
  // Debug logging to track currency changes
  console.log('🪙 useUserCurrency hook called:', {
    userProfile: userProfile ? { id: userProfile.id, email: userProfile.email, preferred_currency: userProfile.preferred_currency } : null,
    preferredCurrency: userProfile?.preferred_currency || DEFAULT_CURRENCY
  });
  
  // Return user's preferred currency or default to USD
  return userProfile?.preferred_currency || DEFAULT_CURRENCY;
};

/**
 * Custom hook to get currency info and formatting functions
 * @returns {object} Currency utilities for the current user
 */
export const useCurrencyUtils = () => {
  const { userProfile } = useAuth();
  const userCurrency = userProfile?.preferred_currency || DEFAULT_CURRENCY;
  
  return {
    userCurrency,
    isDefaultCurrency: userCurrency === DEFAULT_CURRENCY,
    formatAmount: (amount) => {
      const { formatCurrency } = require('@/utils/currencyUtils');
      return formatCurrency(amount, userCurrency);
    }
  };
};

