-- Fix RLS policies for users table to prevent infinite recursion
DO $$ 
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Admins can view all users" ON users;
    DROP POLICY IF EXISTS "Admins can update all users" ON users;
    DROP POLICY IF EXISTS "Admins can insert users" ON users;
    DROP POLICY IF EXISTS "Allow authenticated users to view all users" ON users;
    DROP POLICY IF EXISTS "Allow authenticated users to update all users" ON users;
    DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON users;
    
    -- Create policy for users to view their own profile (this is essential for authentication)
    CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (auth.uid() = id);
    
    -- Create policy for users to update their own profile
    CREATE POLICY "Users can update own profile" ON users
        FOR UPDATE USING (auth.uid() = id);
    
    -- Create policy for admins to view all users (including their own profile)
    CREATE POLICY "Admins can view all users" ON users
        FOR SELECT USING (
            auth.uid() IN (
                SELECT id FROM users WHERE role IN ('admin', 'super_admin')
            )
        );
    
    -- Create policy for admins to update all users (including their own profile)
    CREATE POLICY "Admins can update all users" ON users
        FOR UPDATE USING (
            auth.uid() IN (
                SELECT id FROM users WHERE role IN ('admin', 'super_admin')
            )
        );
    
    -- Create policy for admins to insert new users
    CREATE POLICY "Admins can insert users" ON users
        FOR INSERT WITH CHECK (
            auth.uid() IN (
                SELECT id FROM users WHERE role IN ('admin', 'super_admin')
            )
        );
    
    RAISE NOTICE 'Fixed RLS policies for users table - users can now access their own profile data!';
END $$;
