import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageBuckets() {
  console.log('🧪 Testing Storage Buckets...\n');

  try {
    // 1. Test if we can access storage schema
    console.log('1️⃣ Testing storage schema access...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return;
    }

    console.log('✅ Storage schema accessible');
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
      const testFileName = `test_${Date.now()}.txt`;
      const testFilePath = `test_user@example.com/${testFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wallet-icons')
        .upload(testFilePath, testContent, {
          contentType: 'text/plain'
        });

      if (uploadError) {
        console.error('❌ Upload failed:', uploadError);
      } else {
        console.log('✅ Test file uploaded successfully');
        console.log('   - Path:', uploadData.path);
        
        // Try to download the file
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from('wallet-icons')
          .download(testFilePath);

        if (downloadError) {
          console.error('❌ Download failed:', downloadError);
        } else {
          console.log('✅ Test file downloaded successfully');
          console.log('   - Content:', downloadData.text());
        }

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
    } else {
      console.log('✅ proof_of_payment_files table accessible');
      console.log('   - Records found:', proofFiles.length);
    }

    // 5. Test RLS policies
    console.log('\n5️⃣ Testing RLS policies...');
    
    // Try to insert a test record (this should work for authenticated users)
    const testIconData = {
      user_email: 'test@example.com',
      file_path: 'test/path.png',
      file_name: 'test.png',
      file_size: 1024,
      mime_type: 'image/png'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('wallet_icon_files')
      .insert(testIconData)
      .select();

    if (insertError) {
      console.error('❌ Failed to insert test record:', insertError);
      console.log('   - This might be due to RLS policies or missing permissions');
    } else {
      console.log('✅ Test record inserted successfully');
      console.log('   - ID:', insertData[0].id);
      
      // Clean up - delete the test record
      const { error: deleteError } = await supabase
        .from('wallet_icon_files')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('❌ Failed to delete test record:', deleteError);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function main() {
  console.log('🚀 Starting Storage Bucket Tests...\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Service Key:', supabaseServiceKey ? '✅ Present' : '❌ Missing');
  console.log('');

  await testStorageBuckets();
  
  console.log('\n🏁 Storage bucket tests completed!');
}

main().catch(console.error);
