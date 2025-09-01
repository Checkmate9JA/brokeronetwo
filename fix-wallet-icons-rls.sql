-- Quick fix for wallet icon RLS policies
-- This will make wallet icons publicly accessible

-- 1. Drop ALL existing policies for wallet-icons bucket
DROP POLICY IF EXISTS "Anyone can view wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all wallet icons" ON storage.objects;

-- 2. Create simple, permissive policies for wallet icons
CREATE POLICY "Anyone can view wallet icons" ON storage.objects
FOR SELECT USING (bucket_id = 'wallet-icons');

CREATE POLICY "Authenticated users can upload wallet icons" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'wallet-icons' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update wallet icons" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'wallet-icons' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete wallet icons" ON storage.objects
FOR DELETE USING (
  bucket_id = 'wallet-icons' AND
  auth.role() = 'authenticated'
);

-- 3. Ensure the bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'wallet-icons';

-- 4. Grant public access to storage
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO anon;
