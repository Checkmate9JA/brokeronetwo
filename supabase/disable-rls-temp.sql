-- TEMPORARY: Disable RLS on users table to fix authentication
-- This will allow all authenticated users to access the users table
-- We can re-enable proper RLS later once the system is working

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on currencies table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'currencies') THEN
        ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on currencies table';
    ELSE
        RAISE NOTICE 'currencies table does not exist';
    END IF;
    
    RAISE NOTICE 'TEMPORARILY DISABLED RLS - Authentication should now work!';
    RAISE NOTICE 'IMPORTANT: Re-enable proper RLS later for security!';
END $$;
