-- Verify Storage Bucket Setup
-- Run this to check if everything is working

-- 1. Check if storage buckets exist
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name IN ('wallet-icons', 'proof-of-payment');

-- 2. Check if wallet_icon_files table exists and has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_icon_files'
ORDER BY ordinal_position;

-- 3. Check RLS policies on wallet_icon_files table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'wallet_icon_files';

-- 4. Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%wallet%';

-- 5. Test if we can insert a test record (this will show RLS policy status)
-- Note: This will fail if user is not authenticated, which is expected
DO $$
BEGIN
  RAISE NOTICE 'Testing wallet_icon_files table access...';
  
  -- Try to insert a test record
  INSERT INTO public.wallet_icon_files (
    user_email,
    file_path,
    file_name,
    file_size,
    mime_type
  ) VALUES (
    'test@example.com',
    'test/path.png',
    'test.png',
    1024,
    'image/png'
  );
  
  RAISE NOTICE '✅ Test record inserted successfully';
  
  -- Clean up
  DELETE FROM public.wallet_icon_files WHERE user_email = 'test@example.com';
  RAISE NOTICE '✅ Test record cleaned up';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Test failed: %', SQLERRM;
    RAISE NOTICE 'This might be due to RLS policies or authentication';
END $$;

