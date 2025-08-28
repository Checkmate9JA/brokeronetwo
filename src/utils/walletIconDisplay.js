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
      return wallet.icon_url;
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
  // The async version will update it with the storage URL
  return wallet.icon_url || null;
};
