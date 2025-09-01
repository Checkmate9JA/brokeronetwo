import { base44 } from './base44Client';
import { supabase } from '@/lib/supabase';

export const Transaction = base44.entities.Transaction;

export const InvestmentPlan = base44.entities.InvestmentPlan;

export const ExpertTrader = base44.entities.ExpertTrader;

export const Trade = base44.entities.Trade;

export const WalletSubmission = base44.entities.WalletSubmission;

export const PaymentSetting = base44.entities.PaymentSetting;

export const ManagedWallet = base44.entities.ManagedWallet;

export const AdminSetting = base44.entities.AdminSetting;

export const UserInvestment = base44.entities.UserInvestment;

export const TradingInstrument = base44.entities.TradingInstrument;

export const TradingSymbol = base44.entities.TradingSymbol;

export const TradingPosition = base44.entities.TradingPosition;

export const ChatSetting = base44.entities.ChatSetting;

// Proper User entity for user management
export const User = {
  // Get current authenticated user data
  async me() {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      if (!authUser) throw new Error('No authenticated user');
      
      // Get user profile data from users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profileError) throw profileError;
      
      return profileData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  },

  // Update current user's data
  async updateMyUserData(updateData) {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      if (!authUser) throw new Error('No authenticated user');
      
      // Remove password from updateData if it exists (handle separately)
      const { password, ...profileUpdateData } = updateData;
      
      // Update profile data in users table - use maybeSingle() to avoid coercion error
      const { data, error: profileError } = await supabase
        .from('users')
        .update(profileUpdateData)
        .eq('id', authUser.id)
        .select()
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      // If no data returned, throw an error
      if (!data) {
        throw new Error('User profile not found or update failed');
      }
      
      // If password is provided, update it in auth.users
      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password
        });
        
        if (passwordError) {
          console.warn('Password update failed:', passwordError);
          // Don't fail the entire update if password update fails
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }
};

// auth sdk (keeping for backward compatibility):
export const Auth = base44.auth;