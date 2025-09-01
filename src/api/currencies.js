import { supabase } from '@/lib/supabase';


export const CurrencyAPI = {
  // Get all active currencies from database
  async getAll() {
    try {
      const { data: currencies, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code');
      
      if (error) {
        console.error('Error fetching currencies:', error);
        return [];
      }
      
      return currencies || [];
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return [];
    }
  },

  // Get currency by code from database
  async getByCode(code) {
    try {
      const { data: currency, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching currency by code:', error);
        return null;
      }
      
      return currency;
    } catch (error) {
      console.error('Error fetching currency by code:', error);
      return null;
    }
  },

  // Get currency by code using the database function
  async getByCodeFunction(code) {
    try {
      const { data, error } = await supabase
        .rpc('get_currency_by_code', { currency_code: code });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching currency by code function:', error);
      return null;
    }
  },

  // Get all active currencies using the database function
  async getAllFunction() {
    try {
      const { data, error } = await supabase
        .rpc('get_active_currencies');
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching active currencies function:', error);
      return [];
    }
  }
};

// Utility functions for backward compatibility
export const getCurrencyByCode = async (code) => {
  return await CurrencyAPI.getByCode(code);
};

export const getAllCurrencies = async () => {
  return await CurrencyAPI.getAll();
};
