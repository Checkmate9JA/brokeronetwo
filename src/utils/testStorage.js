import { supabase } from '@/lib/supabase';

/**
 * Test storage bucket functionality in the browser
 * This function can be called from the browser console to test storage
 */
export const testStorageInBrowser = async () => {
  console.log('🧪 Testing Storage in Browser...\n');

  try {
    // 1. Test if we can access storage
    console.log('1️⃣ Testing storage access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return false;
    }

    console.log('✅ Storage accessible');
    console.log('📦 Available buckets:', buckets.map(b => b.name));

    // 2. Check if our buckets exist
    console.log('\n2️⃣ Checking bucket existence...');
    const proofOfPaymentBucket = buckets.find(b => b.name === 'proof-of-payment');
    const walletIconsBucket = buckets.find(b => b.name === 'wallet-icons');

    if (proofOfPaymentBucket) {
      console.log('✅ proof-of-payment bucket exists');
      console.log('   - Public:', proofOfPaymentBucket.public);
      console.log('   - File size limit:', proofOfPaymentBucket.file_size_limit);
    } else {
      console.log('❌ proof-of-payment bucket not found');
    }

    if (walletIconsBucket) {
      console.log('✅ wallet-icons bucket exists');
      console.log('   - Public:', walletIconsBucket.public);
      console.log('   - File size limit:', walletIconsBucket.file_size_limit);
    } else {
      console.log('❌ wallet-icons bucket not found');
    }

    // 3. Test file upload to wallet-icons bucket
    if (walletIconsBucket) {
      console.log('\n3️⃣ Testing file upload to wallet-icons bucket...');
      
      // Create a test file
      const testContent = 'This is a test file for wallet icons';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], `test_${Date.now()}.txt`, { type: 'text/plain' });
      const testFilePath = `test_user@example.com/${testFile.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wallet-icons')
        .upload(testFilePath, testFile);

      if (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        console.log('   - Error details:', uploadError.message);
        console.log('   - Error code:', uploadError.statusCode);
        return false;
      } else {
        console.log('✅ Test file uploaded successfully');
        console.log('   - Path:', uploadData.path);
        
        // Try to get the public URL
        const { data: urlData } = supabase.storage
          .from('wallet-icons')
          .getPublicUrl(testFilePath);
        
        console.log('   - Public URL:', urlData.publicUrl);
        
        // Clean up - delete the test file
        const { error: deleteError } = await supabase.storage
          .from('wallet-icons')
          .remove([testFilePath]);

        if (deleteError) {
          console.error('❌ Failed to delete test file:', deleteError);
        } else {
          console.log('✅ Test file cleaned up');
        }
      }
    }

    // 4. Test database tables
    console.log('\n4️⃣ Testing database tables...');
    
    // Check wallet_icon_files table
    const { data: iconFiles, error: iconFilesError } = await supabase
      .from('wallet_icon_files')
      .select('*')
      .limit(1);

    if (iconFilesError) {
      console.error('❌ Failed to access wallet_icon_files table:', iconFilesError);
      console.log('   - Error details:', iconFilesError.message);
      console.log('   - Error code:', iconFilesError.code);
    } else {
      console.log('✅ wallet_icon_files table accessible');
      console.log('   - Records found:', iconFiles.length);
    }

    // Check proof_of_payment_files table
    const { data: proofFiles, error: proofFilesError } = await supabase
      .from('proof_of_payment_files')
      .select('*')
      .limit(1);

    if (proofFilesError) {
      console.error('❌ Failed to access proof_of_payment_files table:', proofFilesError);
      console.log('   - Error details:', proofFilesError.message);
      console.log('   - Error code:', proofFilesError.code);
    } else {
      console.log('✅ proof_of_payment_files table accessible');
      console.log('   - Records found:', proofFiles.length);
    }

    console.log('\n✅ Storage test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Storage test failed with error:', error);
    console.log('   - Error details:', error.message);
    return false;
  }
};

/**
 * Test wallet icon upload specifically
 */
export const testWalletIconUpload = async () => {
  console.log('🖼️ Testing Wallet Icon Upload...\n');

  try {
    // Create a test image file (1x1 pixel PNG)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Convert base64 to blob
    const response = await fetch(testImageData);
    const testBlob = await response.blob();
    const testFile = new File([testBlob], 'test_icon.png', { type: 'image/png' });

    console.log('📁 Test file created:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });

    // Test upload
    const testFilePath = `test_user@example.com/${testFile.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wallet-icons')
      .upload(testFilePath, testFile);

    if (uploadError) {
      console.error('❌ Icon upload failed:', uploadError);
      console.log('   - Error details:', uploadError.message);
      console.log('   - Error code:', uploadError.statusCode);
      return false;
    }

    console.log('✅ Icon upload successful:', uploadData.path);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('wallet-icons')
      .getPublicUrl(testFilePath);
    
    console.log('   - Public URL:', urlData.publicUrl);
    
    // Clean up
    const { error: deleteError } = await supabase.storage
      .from('wallet-icons')
      .remove([testFilePath]);

    if (deleteError) {
      console.error('❌ Failed to delete test icon:', deleteError);
    } else {
      console.log('✅ Test icon cleaned up');
    }

    return true;

  } catch (error) {
    console.error('❌ Icon upload test failed:', error);
    return false;
  }
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.testStorage = testStorageInBrowser;
  window.testWalletIconUpload = testWalletIconUpload;
  
  console.log('🧪 Storage test functions available:');
  console.log('   - testStorage() - Test general storage functionality');
  console.log('   - testWalletIconUpload() - Test wallet icon upload specifically');
}
