import { supabase } from '@/lib/supabase';

/**
 * Upload a wallet icon to Supabase storage
 * @param {File} file - The icon file to upload
 * @param {string} userEmail - The user's email
 * @param {string} walletName - The wallet name
 * @param {string} walletId - The wallet ID (for existing wallets)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const uploadWalletIcon = async (file, userEmail, walletName, walletId = null) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedWalletName = walletName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${sanitizedWalletName}_${timestamp}.${fileExtension}`;
    const filePath = `${userEmail}/${fileName}`;

    console.log('🖼️ Uploading wallet icon:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath,
      userEmail,
      walletName,
      walletId
    });

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('wallet-icons')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Wallet icon upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('✅ Wallet icon uploaded successfully:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('wallet-icons')
      .getPublicUrl(filePath);

    // Create record in wallet_icon_files table
    const iconData = {
      user_email: userEmail,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type
    };

    // If updating an existing wallet, include wallet_id
    // Note: wallet_id can be null for new wallet uploads
    if (walletId) {
      iconData.wallet_id = walletId;
    }

    const { data: fileRecord, error: recordError } = await supabase
      .from('wallet_icon_files')
      .insert(iconData)
      .select()
      .single();

    if (recordError) {
      console.error('❌ Failed to create icon file record:', recordError);
      // Try to delete the uploaded file if record creation fails
      await supabase.storage
        .from('wallet-icons')
        .remove([filePath]);
      throw new Error(`Failed to create icon file record: ${recordError.message}`);
    }

    console.log('✅ Wallet icon file record created successfully:', fileRecord);

    return {
      success: true,
      data: {
        ...fileRecord,
        publicUrl: urlData.publicUrl,
        storagePath: filePath
      }
    };

  } catch (error) {
    console.error('❌ Wallet icon upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get a public URL for a wallet icon
 * @param {string} filePath - The file path in storage
 * @returns {string} The public URL
 */
export const getWalletIconUrl = (filePath) => {
  if (!filePath) return null;
  
  // For wallet icons, we can use the public URL directly
  const { data } = supabase.storage
    .from('wallet-icons')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

/**
 * Delete a wallet icon
 * @param {string} filePath - The file path in storage
 * @param {string} fileId - The file record ID in the database
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteWalletIcon = async (filePath, fileId) => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('wallet-icons')
      .remove([filePath]);

    if (storageError) {
      throw new Error(`Failed to delete from storage: ${storageError.message}`);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('wallet_icon_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      throw new Error(`Failed to delete from database: ${dbError.message}`);
    }

    console.log('✅ Wallet icon deleted successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Wallet icon deletion failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all wallet icon files for a user
 * @param {string} userEmail - The user's email
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getUserWalletIconFiles = async (userEmail) => {
  try {
    const { data, error } = await supabase
      .from('wallet_icon_files')
      .select('*')
      .eq('user_email', userEmail)
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch icon files: ${error.message}`);
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ Failed to fetch user icon files:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all wallet icon files (admin only)
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getAllWalletIconFiles = async () => {
  try {
    const { data, error } = await supabase
      .from('wallet_icon_files')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch icon files: ${error.message}`);
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ Failed to fetch all icon files:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update wallet icon file status
 * @param {string} fileId - The file record ID
 * @param {boolean} isActive - Whether the icon is active
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const updateWalletIconStatus = async (fileId, isActive) => {
  try {
    const { data, error } = await supabase
      .from('wallet_icon_files')
      .update({ is_active: isActive })
      .eq('id', fileId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update icon status: ${error.message}`);
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ Failed to update icon status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get the active icon for a specific wallet
 * @param {string} walletId - The wallet ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const getWalletActiveIcon = async (walletId) => {
  try {
    const { data, error } = await supabase
      .from('wallet_icon_files')
      .select('*')
      .eq('wallet_id', walletId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active icon found
        return {
          success: true,
          data: null
        };
      }
      throw new Error(`Failed to fetch wallet icon: ${error.message}`);
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ Failed to fetch wallet icon:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Link a wallet icon to a managed wallet
 * @param {string} walletId - The wallet ID
 * @param {string} iconFileId - The icon file ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const linkWalletIcon = async (walletId, iconFileId) => {
  try {
    const { data, error } = await supabase
      .from('managed_wallets')
      .update({ icon_file_id: iconFileId })
      .eq('id', walletId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to link wallet icon: ${error.message}`);
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ Failed to link wallet icon:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
