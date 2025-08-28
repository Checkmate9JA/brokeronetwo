-- Simple RLS fix - completely avoids infinite recursion
-- Run this in your Supabase SQL Editor
-- This script handles existing policies gracefully

-- Step 1: Disable RLS temporarily to break the infinite loop
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (using IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow new user registration" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "user_select_own" ON public.users;
DROP POLICY IF EXISTS "user_update_own" ON public.users;
DROP POLICY IF EXISTS "user_insert_new" ON public.users;
DROP POLICY IF EXISTS "admin_access" ON public.users;

-- Step 3: Create simple, non-recursive policies
-- Policy 1: Users can view their own profile (by email match)
CREATE POLICY "user_select_own" ON public.users
    FOR SELECT USING (
        auth.jwt() ->> 'email' = email
    );

-- Policy 2: Users can update their own profile
CREATE POLICY "user_update_own" ON public.users
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = email
    );

-- Policy 3: Allow new user registration
CREATE POLICY "user_insert_new" ON public.users
    FOR INSERT WITH CHECK (true);

-- Policy 4: Admin access - use JWT claims instead of table lookup
-- This avoids the circular dependency completely
CREATE POLICY "admin_access" ON public.users
    FOR ALL USING (
        -- Check JWT claims directly - no table access needed
        (auth.jwt() ->> 'role')::text IN ('admin', 'super_admin')
    );

-- Step 4: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the fix (fixed the UNION type mismatch)
-- Check RLS status
SELECT 
    'RLS Status' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables 
WHERE tablename = 'users';

-- Check policies count
SELECT 
    'Policies' as check_type,
    tablename,
    COUNT(*)::text as policy_count
FROM pg_policies 
WHERE tablename = 'users'
GROUP BY tablename;

-- Step 6: Test if we can now access the users table
-- This should work without infinite recursion
SELECT COUNT(*) as user_count FROM public.users LIMIT 1;
