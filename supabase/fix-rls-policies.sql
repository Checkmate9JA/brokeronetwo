-- Fix for infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor to fix the authentication issues

-- First, disable RLS temporarily to break the infinite loop
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that are causing issues
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow new user registration" ON public.users;

-- Create a simple, working policy that doesn't cause recursion
-- Allow users to view their own profile by email
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (
        auth.jwt() ->> 'email' = email
    );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = email
    );

-- Allow new user registration (this will be handled by the trigger function)
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (true);

-- For admin access, use a different approach that doesn't cause recursion
-- Create a function to check admin status without accessing users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user's JWT has admin claims
    -- This avoids the circular dependency
    RETURN (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Now create admin policies using the function
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        public.is_admin()
    );

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        public.is_admin()
    );

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Test the policies
-- This should now work without infinite recursion
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
