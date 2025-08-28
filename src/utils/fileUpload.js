import { supabase } from '@/lib/supabase';

/**
 * Upload a proof of payment file to Supabase storage
 * @param {File} file - The file to upload
 * @param {string} userEmail - The user's email
 * @param {string} transactionId - The transaction ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const uploadProofOfPayment = async (file, userEmail, transactionId) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'image/svg+xml'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only images and PDFs are allowed.');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${transactionId}_${timestamp}.${fileExtension}`;
    const filePath = `${userEmail}/${fileName}`;

    console.log('📁 Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath,
      userEmail,
      transactionId
    });

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('proof-of-payment')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ File upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('✅ File uploaded successfully:', data);

    // Get the public URL (this will be a signed URL for private buckets)
    const { data: urlData } = supabase.storage
      .from('proof-of-payment')
      .getPublicUrl(filePath);

    // Create record in proof_of_payment_files table
    const { data: fileRecord, error: recordError } = await supabase
      .from('proof_of_payment_files')
      .insert({
        transaction_id: transactionId,
        user_email: userEmail,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single();

    if (recordError) {
      console.error('❌ Failed to create file record:', recordError);
      // Try to delete the uploaded file if record creation fails
      await supabase.storage
        .from('proof-of-payment')
        .remove([filePath]);
      throw new Error(`Failed to create file record: ${recordError.message}`);
    }

    console.log('✅ File record created successfully:', fileRecord);

    return {
      success: true,
      data: {
        ...fileRecord,
        publicUrl: urlData.publicUrl,
        storagePath: filePath
      }
    };

  } catch (error) {
    console.error('❌ File upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get a signed URL for a proof of payment file
 * @param {string} filePath - The file path in storage
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export const getProofOfPaymentUrl = async (filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from('proof-of-payment')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return {
      success: true,
      data: data.signedUrl
    };

  } catch (error) {
    console.error('❌ Failed to get signed URL:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a proof of payment file
 * @param {string} filePath - The file path in storage
 * @param {string} fileId - The file record ID in the database
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteProofOfPayment = async (filePath, fileId) => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('proof-of-payment')
      .remove([filePath]);

    if (storageError) {
      throw new Error(`Failed to delete from storage: ${storageError.message}`);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('proof_of_payment_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      throw new Error(`Failed to delete from database: ${dbError.message}`);
    }

    console.log('✅ File deleted successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ File deletion failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all proof of payment files for a user
 * @param {string} userEmail - The user's email
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getUserProofOfPaymentFiles = async (userEmail) => {
  try {
    const { data, error } = await supabase
      .from('proof_of_payment_files')
      .select('*')
      .eq('user_email', userEmail)
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ Failed to fetch user files:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all proof of payment files (admin only)
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getAllProofOfPaymentFiles = async () => {
  try {
    const { data, error } = await supabase
      .from('proof_of_payment_files')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ Failed to fetch all files:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update proof of payment file status (admin only)
 * @param {string} fileId - The file record ID
 * @param {string} status - The new status ('approved', 'rejected', 'pending')
 * @param {string} adminNotes - Admin notes about the file
 * @param {string} adminId - The admin user ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const updateProofOfPaymentStatus = async (fileId, status, adminNotes = '', adminId) => {
  try {
    const updateData = {
      status,
      admin_notes: adminNotes,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('proof_of_payment_files')
      .update(updateData)
      .eq('id', fileId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ Failed to update file status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
