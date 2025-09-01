import { supabase } from '@/lib/supabase';

/**
 * Get the display URL for a wallet icon
 * @param {Object} wallet - The wallet object
 * @returns {Promise<string|null>} The icon URL or null if no icon
 */
export const getWalletIconDisplayUrl = async (wallet) => {
  try {
    // If wallet has icon_file_id, get the icon from storage
    if (wallet.icon_file_id) {
      const { data: iconFile, error } = await supabase
        .from('wallet_icon_files')
        .select('*')
        .eq('id', wallet.icon_file_id)
        .eq('is_active', true)
        .single();

      if (error || !iconFile) {
        console.warn('Icon file not found:', wallet.icon_file_id);
        return null;
      }

      // Get public URL from storage
      const { data: urlData } = supabase.storage
        .from('wallet-icons')
        .getPublicUrl(iconFile.file_path);

      return urlData.publicUrl;
    }

    // Fallback to old icon_url if no icon_file_id
    if (wallet.icon_url) {
      // Check if it's already a full URL
      if (wallet.icon_url.startsWith('http')) {
        return wallet.icon_url;
      }
      
      // If it's a relative path, try to get from storage
      try {
        const { data: urlData } = supabase.storage
          .from('wallet-icons')
          .getPublicUrl(wallet.icon_url);
        return urlData.publicUrl;
      } catch (error) {
        console.warn('Failed to get storage URL for:', wallet.icon_url);
        return wallet.icon_url; // Return as-is if storage fails
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting wallet icon URL:', error);
    return null;
  }
};

/**
 * Get wallet icon URL synchronously (for immediate display)
 * @param {Object} wallet - The wallet object
 * @returns {string|null} The icon URL or null
 */
export const getWalletIconUrlSync = (wallet) => {
  // For immediate display, use icon_url if available
  if (wallet.icon_url) {
    // If it's already a full URL, return it
    if (wallet.icon_url.startsWith('http')) {
      return wallet.icon_url;
    }
    
    // If it's a relative path, construct the storage URL
    try {
      const { data: urlData } = supabase.storage
        .from('wallet-icons')
        .getPublicUrl(wallet.icon_url);
      return urlData.publicUrl;
    } catch (error) {
      console.warn('Failed to get storage URL synchronously:', error);
      // Fallback to direct URL construction
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jgaknhtgpsghebhruxvt.supabase.co';
      return `${supabaseUrl}/storage/v1/object/public/wallet-icons/${wallet.icon_url}`;
    }
  }
  
  return null;
};

/**
 * Check if a wallet has a valid icon
 * @param {Object} wallet - The wallet object
 * @returns {boolean} True if wallet has an icon
 */
export const hasWalletIcon = (wallet) => {
  return !!(wallet.icon_url || wallet.icon_file_id);
};

/**
 * Get the fallback display for a wallet (first letter or default icon)
 * @param {Object} wallet - The wallet object
 * @returns {string} The fallback display text
 */
export const getWalletFallbackDisplay = (wallet) => {
  if (wallet.name && wallet.name.length > 0) {
    return wallet.name.charAt(0).toUpperCase();
  }
  return 'W'; // Default wallet icon
};

/**
 * Get a simple, direct icon URL for testing
 * @param {Object} wallet - The wallet object
 * @returns {string|null} The icon URL
 */
export const getSimpleIconUrl = (wallet) => {
  if (!wallet.icon_url) return null;
  
  // If it's already a full URL, return it
  if (wallet.icon_url.startsWith('http')) {
    return wallet.icon_url;
  }
  
  // Construct a simple storage URL
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jgaknhtgpsghebhruxvt.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/wallet-icons/${wallet.icon_url}`;
};
