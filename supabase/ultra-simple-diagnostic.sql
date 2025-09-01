-- Ultra Simple Diagnostic for Maintenance Mode Issue
-- This script will identify the exact cause step by step

-- 1. Check if user exists in users table
SELECT 'User exists in users table' as check, 
       id, email, full_name, role 
FROM users 
WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25';

-- 2. Check if user exists in auth.users table
SELECT 'User exists in auth.users' as check, 
       id, email, created_at 
FROM auth.users 
WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25';

-- 3. Check maintenance_mode table structure
SELECT 'Maintenance mode table columns' as check, 
       column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'maintenance_mode'
ORDER BY ordinal_position;

-- 4. Check users table structure for id column
SELECT 'Users table id column' as check, 
       column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';

-- 5. Check if maintenance_mode table has data
SELECT 'Maintenance mode records' as check, COUNT(*) as count FROM maintenance_mode;

-- 6. Check RLS policies on maintenance_mode
SELECT 'RLS policies' as check, 
       policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename = 'maintenance_mode';

-- 7. Test direct update (this is what's failing)
DO $$
DECLARE
    test_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = test_user_id) INTO user_exists;
    RAISE NOTICE 'User exists in users table: %', user_exists;
    
    IF user_exists THEN
        -- Try the exact update that's failing
        BEGIN
            UPDATE maintenance_mode 
            SET started_by = test_user_id,
                updated_at = NOW()
            WHERE id = (SELECT id FROM maintenance_mode ORDER BY id DESC LIMIT 1);
            RAISE NOTICE 'SUCCESS: Update worked!';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Update failed with: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'ERROR: User not found in users table';
    END IF;
END $$;
