-- Fix for existing wallet-icons storage policies
-- Run this to resolve policy conflicts

-- 1. Drop existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can upload wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own wallet icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all wallet icons" ON storage.objects;

-- 2. Recreate the policies
CREATE POLICY "Authenticated users can upload wallet icons" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'wallet-icons' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view wallet icons" ON storage.objects
FOR SELECT USING (
  bucket_id = 'wallet-icons'
);

CREATE POLICY "Users can update their own wallet icons" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'wallet-icons' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'email'
);

CREATE POLICY "Users can delete their own wallet icons" ON storage.objects
FOR DELETE USING (
  bucket_id = 'wallet-icons' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'email'
);

CREATE POLICY "Admins can manage all wallet icons" ON storage.objects
FOR ALL USING (
  bucket_id = 'wallet-icons' AND
  (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  )
);

-- 3. Fix the wallet_icon_files table if it has constraints
ALTER TABLE public.wallet_icon_files 
ALTER COLUMN wallet_id DROP NOT NULL;

-- 4. Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

