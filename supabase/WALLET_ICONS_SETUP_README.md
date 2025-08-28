# Storage Bucket Setup for Wallet Icons

This document provides step-by-step instructions for setting up the storage infrastructure for handling wallet icon uploads in your Supabase project.

## 🚀 Quick Setup

### 1. Run the Wallet Icons Storage Setup SQL Script

Execute the `wallet-icons-storage-setup.sql` script in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content of wallet-icons-storage-setup.sql
-- This will create the bucket, tables, and policies automatically
```

### 2. Verify Bucket Creation

In your Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Verify that `wallet-icons` bucket exists
3. Check that it's set to **Public** (wallet icons need to be accessible)

### 3. Test the Setup

Use the provided utility functions in `src/utils/walletIconUpload.js` to test icon uploads.

## 📋 What Gets Created

### Storage Bucket
- **Name**: `wallet-icons`
- **Privacy**: Public (wallet icons need to be accessible)
- **File Size Limit**: 5MB
- **Allowed Types**: Images (JPEG, PNG, GIF, WebP, SVG)

### Database Table
- **Table**: `wallet_icon_files`
- **Purpose**: Track uploaded wallet icon files and their metadata
- **Fields**: File info, wallet links, status tracking

### RLS Policies
- **User Access**: Users can only manage their own uploaded icons
- **Public Access**: Anyone can view wallet icons
- **Admin Access**: Admins can manage all icons
- **Security**: Proper authentication and authorization

## 🔧 Manual Setup (Alternative)

If the SQL script doesn't work, you can set up manually:

### 1. Create Storage Bucket

In Supabase Dashboard → Storage → New Bucket:
- **ID**: `wallet-icons`
- **Name**: `wallet-icons`
- **Public**: ✅ (Keep public for accessibility)
- **File Size Limit**: 5MB
- **Allowed MIME Types**: 
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `image/svg+xml`

### 2. Create Database Table

```sql
CREATE TABLE public.wallet_icon_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.managed_wallets(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Enable RLS and Create Policies

```sql
-- Enable RLS
ALTER TABLE public.wallet_icon_files ENABLE ROW LEVEL SECURITY;

-- User policies (view own files)
CREATE POLICY "Users can view their own wallet icon files" 
ON public.wallet_icon_files
FOR SELECT USING (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Admin policies (view all files)
CREATE POLICY "Admins can view all wallet icon files" 
ON public.wallet_icon_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);
```

## 🧪 Testing the Setup

### 1. Test Icon Upload

```javascript
import { uploadWalletIcon } from '@/utils/walletIconUpload';

const testUpload = async () => {
  const file = new File(['test'], 'test.png', { type: 'image/png' });
  const result = await uploadWalletIcon(file, 'user@example.com', 'Test Wallet');
  
  if (result.success) {
    console.log('Upload successful:', result.data);
  } else {
    console.error('Upload failed:', result.error);
  }
};
```

### 2. Test Icon Retrieval

```javascript
import { getWalletIconUrl } from '@/utils/walletIconUpload';

const testRetrieval = () => {
  const iconUrl = getWalletIconUrl('user@example.com/test_wallet_1234567890.png');
  console.log('Icon URL:', iconUrl);
};
```

## 🚨 Troubleshooting

### Common Issues

1. **Bucket Not Found**
   - Verify the bucket was created in Supabase Dashboard
   - Check bucket ID matches exactly: `wallet-icons`

2. **Permission Denied**
   - Ensure RLS policies are properly set
   - Check user authentication status
   - Verify user role permissions

3. **Icon Upload Fails**
   - Check file size (must be ≤ 5MB)
   - Verify file type is allowed
   - Check browser console for detailed errors

4. **Database Errors**
   - Ensure `wallet_icon_files` table exists
   - Check foreign key constraints
   - Verify RLS policies are enabled

### Debug Steps

1. **Check Supabase Logs**
   - Go to Dashboard → Logs
   - Look for storage and database errors

2. **Verify RLS Policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'wallet_icon_files';
   ```

3. **Test Storage Access**
   ```sql
   -- Test if you can access storage schema
   SELECT * FROM storage.buckets WHERE id = 'wallet-icons';
   ```

## 📚 API Reference

### Icon Upload Functions

- `uploadWalletIcon(file, userEmail, walletName, walletId)` - Upload an icon
- `getWalletIconUrl(filePath)` - Get public URL
- `deleteWalletIcon(filePath, fileId)` - Delete an icon
- `getUserWalletIconFiles(userEmail)` - Get user's icons
- `getAllWalletIconFiles()` - Get all icons (admin)
- `updateWalletIconStatus(fileId, isActive)` - Update status
- `getWalletActiveIcon(walletId)` - Get active icon for wallet
- `linkWalletIcon(walletId, iconFileId)` - Link icon to wallet

### File Structure

```
wallet-icons/
├── user1@example.com/
│   ├── Bitcoin_Wallet_1234567890.png
│   └── Ethereum_Wallet_1234567891.jpg
├── user2@example.com/
│   └── Payoneer_Wallet_1234567892.svg
```

## 🔒 Security Features

- **Public Bucket**: Icons are publicly accessible (required for wallet display)
- **User Isolation**: Users can only manage their own uploaded icons
- **Admin Oversight**: Admins can review and manage all icons
- **File Validation**: Size and type restrictions enforced
- **Audit Trail**: All icon operations are logged
- **Automatic Cleanup**: Old icons are deactivated when new ones are uploaded

## 📝 Integration with Wallet Modals

### AddWalletModal Integration

```javascript
import { uploadWalletIcon, linkWalletIcon } from '@/utils/walletIconUpload';

const handleIconUpload = async (file) => {
  // Upload the icon
  const uploadResult = await uploadWalletIcon(file, userEmail, walletName);
  
  if (uploadResult.success) {
    // Create the wallet
    const walletResult = await createWallet(walletData);
    
    if (walletResult.success) {
      // Link the icon to the wallet
      await linkWalletIcon(walletResult.data.id, uploadResult.data.id);
    }
  }
};
```

### EditWalletModal Integration

```javascript
import { uploadWalletIcon, linkWalletIcon } from '@/utils/walletIconUpload';

const handleIconUpdate = async (file) => {
  // Upload the new icon
  const uploadResult = await uploadWalletIcon(file, userEmail, walletName, walletId);
  
  if (uploadResult.success) {
    // Link the new icon to the wallet
    await linkWalletIcon(walletId, uploadResult.data.id);
  }
};
```

## 🎯 Key Features

### Automatic Icon Management
- **Version Control**: Only one active icon per wallet
- **Automatic Cleanup**: Old icons are deactivated automatically
- **Seamless Updates**: New icons replace old ones seamlessly

### Performance Optimization
- **Public URLs**: No need for signed URLs (faster loading)
- **Caching**: Proper cache control headers
- **Indexed Queries**: Fast database lookups

### User Experience
- **Drag & Drop**: Easy icon upload interface
- **Preview**: Real-time icon preview
- **Validation**: Immediate feedback on file requirements

## 📝 Next Steps

After setup:
1. Integrate icon upload into AddWalletModal
2. Add icon upload to EditWalletModal
3. Implement drag & drop interface
4. Add image preview functionality
5. Set up icon cleanup for deleted wallets

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase logs for detailed error messages
3. Verify all SQL scripts executed successfully
4. Test with the provided utility functions
5. Check that the bucket is set to public

## 🔄 Migration from Existing System

If you're migrating from a system that stores icon URLs directly in the `managed_wallets` table:

1. **Backup existing data**
2. **Run the setup script**
3. **Migrate existing icons** (if any)
4. **Update your wallet modals** to use the new upload system
5. **Test thoroughly** before going live
