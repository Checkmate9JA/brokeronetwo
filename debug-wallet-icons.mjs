import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '***' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWalletIcons() {
  console.log('🔍 Debugging Wallet Icons...\n');

  try {
    // 1. Check wallets in database
    console.log('1. Checking wallets in database...');
    const { data: wallets, error: walletError } = await supabase
      .from('managed_wallets')
      .select('*')
      .limit(10);

    if (walletError) {
      console.error('❌ Error fetching wallets:', walletError);
    } else {
      console.log(`✅ Found ${wallets.length} wallets:`);
      wallets.forEach(wallet => {
        console.log(`   - ${wallet.name}: icon_url="${wallet.icon_url}", icon_file_id="${wallet.icon_file_id}"`);
      });
    }

    // 2. Check storage bucket
    console.log('\n2. Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
    } else {
      const walletBucket = buckets.find(b => b.id === 'wallet-icons');
      if (walletBucket) {
        console.log('✅ wallet-icons bucket found:', walletBucket);
        
        // List files in the bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('wallet-icons')
          .list('', { limit: 100 });
        
        if (filesError) {
          console.error('❌ Error listing files:', filesError);
        } else {
          console.log(`📁 Found ${files.length} files in bucket:`);
          files.forEach(file => {
            console.log(`   - ${file.name} (${file.metadata?.size || 'unknown size'})`);
          });
        }
      } else {
        console.log('❌ wallet-icons bucket not found');
        console.log('Available buckets:', buckets.map(b => b.id));
      }
    }

    // 3. Test URL generation for a wallet with icon
    console.log('\n3. Testing URL generation...');
    if (wallets && wallets.length > 0) {
      const walletWithIcon = wallets.find(w => w.icon_url);
      if (walletWithIcon) {
        console.log(`Testing URL for: ${walletWithIcon.name}`);
        console.log(`Original icon_url: ${walletWithIcon.icon_url}`);
        
        try {
          const { data: urlData } = supabase.storage
            .from('wallet-icons')
            .getPublicUrl(walletWithIcon.icon_url);
          
          console.log('✅ Generated URL:', urlData.publicUrl);
          
          // Test if URL is accessible
          try {
            const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
            console.log(`📡 URL accessibility: ${response.status} ${response.statusText}`);
          } catch (fetchError) {
            console.log('📡 URL accessibility: Failed to fetch -', fetchError.message);
          }
        } catch (urlError) {
          console.error('❌ Error generating URL:', urlError);
        }
      } else {
        console.log('ℹ️ No wallets with icons found');
      }
    }

    // 4. Check wallet_icon_files table
    console.log('\n4. Checking wallet_icon_files table...');
    const { data: iconFiles, error: iconError } = await supabase
      .from('wallet_icon_files')
      .select('*')
      .limit(10);

    if (iconError) {
      console.error('❌ Error fetching icon files:', iconError);
    } else {
      console.log(`✅ Found ${iconFiles.length} icon file records:`);
      iconFiles.forEach(file => {
        console.log(`   - ${file.file_name}: path="${file.file_path}", active=${file.is_active}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugWalletIcons().then(() => {
  console.log('\n🏁 Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
