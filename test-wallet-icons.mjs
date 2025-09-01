import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWalletIcons() {
  console.log('🔍 Testing Wallet Icon Access...\n');

  try {
    // 1. Test storage bucket access
    console.log('1. Testing storage bucket access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError);
    } else {
      const walletBucket = buckets.find(b => b.id === 'wallet-icons');
      if (walletBucket) {
        console.log('✅ wallet-icons bucket found:', walletBucket);
      } else {
        console.log('❌ wallet-icons bucket not found');
        console.log('Available buckets:', buckets.map(b => b.id));
      }
    }

    // 2. Test wallet data from database
    console.log('\n2. Testing wallet data from database...');
    const { data: wallets, error: walletError } = await supabase
      .from('managed_wallets')
      .select('*')
      .limit(5);

    if (walletError) {
      console.error('❌ Failed to fetch wallets:', walletError);
    } else {
      console.log(`✅ Found ${wallets.length} wallets`);
      wallets.forEach(wallet => {
        console.log(`   - ${wallet.name}: icon_url=${wallet.icon_url}, icon_file_id=${wallet.icon_file_id}`);
      });
    }

    // 3. Test storage object access
    console.log('\n3. Testing storage object access...');
    if (wallets && wallets.length > 0) {
      const walletWithIcon = wallets.find(w => w.icon_url);
      if (walletWithIcon) {
        console.log(`Testing icon access for: ${walletWithIcon.name}`);
        
        try {
          const { data: urlData } = supabase.storage
            .from('wallet-icons')
            .getPublicUrl(walletWithIcon.icon_url);
          
          console.log('✅ Storage URL generated:', urlData.publicUrl);
          
          // Test if the URL is accessible
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log('✅ Icon URL is accessible');
          } else {
            console.log(`❌ Icon URL not accessible: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.error('❌ Failed to generate storage URL:', error);
        }
      } else {
        console.log('ℹ️ No wallets with icons found to test');
      }
    }

    // 4. Test wallet_icon_files table
    console.log('\n4. Testing wallet_icon_files table...');
    const { data: iconFiles, error: iconError } = await supabase
      .from('wallet_icon_files')
      .select('*')
      .limit(5);

    if (iconError) {
      console.error('❌ Failed to fetch icon files:', iconError);
    } else {
      console.log(`✅ Found ${iconFiles.length} icon files`);
      iconFiles.forEach(file => {
        console.log(`   - ${file.file_name}: path=${file.file_path}, active=${file.is_active}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWalletIcons().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
