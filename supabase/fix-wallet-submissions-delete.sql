-- Fix wallet_submissions table deletion issues
-- Run this in Supabase SQL Editor

-- 1. First, let's check the current state
SELECT 'Current table state:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'wallet_submissions';

-- 2. Check current RLS policies
SELECT 'Current RLS policies:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'wallet_submissions';

-- 3. Drop existing policies that might be blocking deletion
DROP POLICY IF EXISTS "Enable read access for all users" ON wallet_submissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON wallet_submissions;
DROP POLICY IF EXISTS "Enable update for users based on user_email" ON wallet_submissions;
DROP POLICY IF EXISTS "Enable delete for users based on user_email" ON wallet_submissions;
DROP POLICY IF EXISTS "Enable delete for admins" ON wallet_submissions;

-- 4. Create proper RLS policies that allow deletion
-- Policy for reading submissions (users can read their own, admins can read all)
CREATE POLICY "Enable read access for authenticated users" ON wallet_submissions
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' = user_email OR
            auth.jwt() ->> 'role' IN ('admin', 'super_admin')
        )
    );

-- Policy for inserting submissions (users can insert their own)
CREATE POLICY "Enable insert for authenticated users" ON wallet_submissions
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.jwt() ->> 'email' = user_email
    );

-- Policy for updating submissions (users can update their own, admins can update any)
CREATE POLICY "Enable update for authenticated users" ON wallet_submissions
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' = user_email OR
            auth.jwt() ->> 'role' IN ('admin', 'super_admin')
        )
    );

-- Policy for deleting submissions (users can delete their own, admins can delete any)
CREATE POLICY "Enable delete for authenticated users" ON wallet_submissions
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' = user_email OR
            auth.jwt() ->> 'role' IN ('admin', 'super_admin')
        )
    );

-- 5. Ensure RLS is enabled
ALTER TABLE wallet_submissions ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT ALL ON wallet_submissions TO authenticated;
GRANT ALL ON wallet_submissions TO service_role;

-- 7. Verify the policies were created
SELECT 'New RLS policies:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'wallet_submissions';

-- 8. Test deletion (replace with actual submission ID)
-- DELETE FROM wallet_submissions WHERE id = 'your-test-id' RETURNING *;

-- 9. Check if there are any triggers that might interfere
SELECT 'Triggers on wallet_submissions:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'wallet_submissions';

-- 10. If there are problematic triggers, you can drop them
-- DROP TRIGGER IF EXISTS trigger_name ON wallet_submissions;
