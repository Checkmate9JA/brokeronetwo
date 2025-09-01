import { supabase } from '@/lib/supabase';

// Default currency for all users
export const DEFAULT_CURRENCY = 'USD';

// Currency symbols mapping
export const CURRENCY_SYMBOLS = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CAD': 'C$',
  'AUD': 'A$',
  'CHF': 'CHF',
  'CNY': '¥',
  'INR': '₹',
  'BRL': 'R$',
  'ZAR': 'R',
  'NGN': '₦',
  'KES': 'KSh',
  'GHS': 'GH₵',
  'UGX': 'USh',
  'TZS': 'TSh',
  'MAD': 'MAD',
  'EGP': 'E£',
  'TRY': '₺',
  'RUB': '₽'
};

/**
 * Format amount based on user's preferred currency
 * @param {number} amount - The amount to format
 * @param {string} userCurrency - User's preferred currency code
 * @param {boolean} showSymbol - Whether to show currency symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, userCurrency = DEFAULT_CURRENCY, showSymbol = true) => {
  if (amount === null || amount === undefined) return '0';
  
  const currency = userCurrency || DEFAULT_CURRENCY;
  const symbol = showSymbol ? (CURRENCY_SYMBOLS[currency] || currency) : '';
  
  // Format based on currency type
  if (currency === 'JPY') {
    // Japanese Yen - no decimal places
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  } else if (currency === 'NGN' || currency === 'KES' || currency === 'UGX' || currency === 'TZS') {
    // African currencies - 2 decimal places
    return `${symbol}${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  } else {
    // Standard currencies - 2 decimal places
    return `${symbol}${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
};

/**
 * Get user's preferred currency from context or database
 * @param {string} userId - User ID
 * @returns {Promise<string>} User's preferred currency code
 */
export const getUserPreferredCurrency = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('preferred_currency')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.warn('Error fetching user currency:', error);
      return DEFAULT_CURRENCY;
    }
    
    return data?.preferred_currency || DEFAULT_CURRENCY;
  } catch (error) {
    console.warn('Error in getUserPreferredCurrency:', error);
    return DEFAULT_CURRENCY;
  }
};

/**
 * Format amount for display in user's preferred currency
 * @param {number} amount - Amount to format
 * @param {string} userId - User ID
 * @param {boolean} showSymbol - Whether to show currency symbol
 * @returns {Promise<string>} Formatted currency string
 */
export const formatUserCurrency = async (amount, userId, showSymbol = true) => {
  const userCurrency = await getUserPreferredCurrency(userId);
  return formatCurrency(amount, userCurrency, showSymbol);
};

/**
 * Get currency display info for a user
 * @param {string} userCurrency - Currency code
 * @returns {object} Currency display information
 */
export const getCurrencyInfo = (userCurrency = DEFAULT_CURRENCY) => {
  return {
    code: userCurrency,
    symbol: CURRENCY_SYMBOLS[userCurrency] || userCurrency,
    isDefault: userCurrency === DEFAULT_CURRENCY
  };
};



/**
 * Check if a currency is supported by the system
 * @param {string} currencyCode - Currency code to check
 * @returns {boolean} Whether currency is supported
 */
export const isValidCurrency = (currencyCode) => {
  return Object.keys(CURRENCY_SYMBOLS).includes(currencyCode);
};


