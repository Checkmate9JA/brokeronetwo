# Storage Bucket Setup for Proof of Payment

This document provides step-by-step instructions for setting up the storage infrastructure for handling proof of payment files in your Supabase project.

## 🚀 Quick Setup

### 1. Run the Storage Setup SQL Script

Execute the `storage-setup.sql` script in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content of storage-setup.sql
-- This will create the bucket, tables, and policies automatically
```

### 2. Verify Bucket Creation

In your Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Verify that `proof-of-payment` bucket exists
3. Check that it's set to **Private** (not public)

### 3. Test the Setup

Use the provided utility functions in `src/utils/fileUpload.js` to test file uploads.

## 📋 What Gets Created

### Storage Bucket
- **Name**: `proof-of-payment`
- **Privacy**: Private (secure)
- **File Size Limit**: 10MB
- **Allowed Types**: Images (JPEG, PNG, GIF, WebP, SVG) and PDFs

### Database Table
- **Table**: `proof_of_payment_files`
- **Purpose**: Track uploaded files and their metadata
- **Fields**: File info, transaction links, status tracking

### RLS Policies
- **User Access**: Users can only access their own files
- **Admin Access**: Admins can view and manage all files
- **Security**: Proper authentication and authorization

## 🔧 Manual Setup (Alternative)

If the SQL script doesn't work, you can set up manually:

### 1. Create Storage Bucket

In Supabase Dashboard → Storage → New Bucket:
- **ID**: `proof-of-payment`
- **Name**: `proof-of-payment`
- **Public**: ❌ (Keep private)
- **File Size Limit**: 10MB
- **Allowed MIME Types**: 
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `application/pdf`
  - `image/svg+xml`

### 2. Create Database Table

```sql
CREATE TABLE public.proof_of_payment_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);
```

### 3. Enable RLS and Create Policies

```sql
-- Enable RLS
ALTER TABLE public.proof_of_payment_files ENABLE ROW LEVEL SECURITY;

-- User policies (view own files)
CREATE POLICY "Users can view their own proof of payment files" 
ON public.proof_of_payment_files
FOR SELECT USING (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Admin policies (view all files)
CREATE POLICY "Admins can view all proof of payment files" 
ON public.proof_of_payment_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);
```

## 🧪 Testing the Setup

### 1. Test File Upload

```javascript
import { uploadProofOfPayment } from '@/utils/fileUpload';

const testUpload = async () => {
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const result = await uploadProofOfPayment(file, 'user@example.com', 'transaction-id');
  
  if (result.success) {
    console.log('Upload successful:', result.data);
  } else {
    console.error('Upload failed:', result.error);
  }
};
```

### 2. Test File Retrieval

```javascript
import { getUserProofOfPaymentFiles } from '@/utils/fileUpload';

const testRetrieval = async () => {
  const result = await getUserProofOfPaymentFiles('user@example.com');
  
  if (result.success) {
    console.log('Files retrieved:', result.data);
  } else {
    console.error('Retrieval failed:', result.error);
  }
};
```

## 🚨 Troubleshooting

### Common Issues

1. **Bucket Not Found**
   - Verify the bucket was created in Supabase Dashboard
   - Check bucket ID matches exactly: `proof-of-payment`

2. **Permission Denied**
   - Ensure RLS policies are properly set
   - Check user authentication status
   - Verify user role permissions

3. **File Upload Fails**
   - Check file size (must be ≤ 10MB)
   - Verify file type is allowed
   - Check browser console for detailed errors

4. **Database Errors**
   - Ensure `proof_of_payment_files` table exists
   - Check foreign key constraints
   - Verify RLS policies are enabled

### Debug Steps

1. **Check Supabase Logs**
   - Go to Dashboard → Logs
   - Look for storage and database errors

2. **Verify RLS Policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'proof_of_payment_files';
   ```

3. **Test Storage Access**
   ```sql
   -- Test if you can access storage schema
   SELECT * FROM storage.buckets WHERE id = 'proof-of-payment';
   ```

## 📚 API Reference

### File Upload Functions

- `uploadProofOfPayment(file, userEmail, transactionId)` - Upload a file
- `getProofOfPaymentUrl(filePath, expiresIn)` - Get signed URL
- `deleteProofOfPayment(filePath, fileId)` - Delete a file
- `getUserProofOfPaymentFiles(userEmail)` - Get user's files
- `getAllProofOfPaymentFiles()` - Get all files (admin)
- `updateProofOfPaymentStatus(fileId, status, notes, adminId)` - Update status

### File Structure

```
proof-of-payment/
├── user1@example.com/
│   ├── transaction1_timestamp.jpg
│   └── transaction2_timestamp.pdf
├── user2@example.com/
│   └── transaction3_timestamp.png
```

## 🔒 Security Features

- **Private Bucket**: Files are not publicly accessible
- **User Isolation**: Users can only access their own files
- **Admin Oversight**: Admins can review and manage all files
- **File Validation**: Size and type restrictions enforced
- **Audit Trail**: All file operations are logged

## 📝 Next Steps

After setup:
1. Integrate file upload into your Deposit Funds modal
2. Add file preview functionality
3. Implement admin review interface
4. Set up file cleanup for old/rejected files
5. Add file compression for large images

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase logs for detailed error messages
3. Verify all SQL scripts executed successfully
4. Test with the provided utility functions
