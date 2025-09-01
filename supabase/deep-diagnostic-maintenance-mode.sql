-- Deep Diagnostic for Maintenance Mode Foreign Key Issue
-- This script will identify the exact cause of the constraint violation

-- 1. Check the exact user record
SELECT 
    'User Record Details' as check_type,
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM users 
WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25';

-- 2. Check if there are any data type mismatches
SELECT 
    'Data Type Check' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'email', 'full_name', 'role');

-- 3. Check maintenance_mode table structure
SELECT 
    'Maintenance Mode Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'maintenance_mode';

-- 4. Check the foreign key constraint definition
SELECT 
    'Foreign Key Constraint' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'maintenance_mode'
AND kcu.column_name = 'started_by';

-- 5. Check if there are any RLS policies blocking the operation
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'maintenance_mode';

-- 6. Test the exact operation that's failing
DO $$
DECLARE
    test_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    user_exists BOOLEAN;
    constraint_error TEXT;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = test_user_id) INTO user_exists;
    
    RAISE NOTICE 'User exists: %', user_exists;
    
    IF user_exists THEN
        -- Try to update maintenance_mode with this user
        BEGIN
            UPDATE maintenance_mode 
            SET started_by = test_user_id,
                updated_at = NOW()
            WHERE id = (SELECT id FROM maintenance_mode ORDER BY id DESC LIMIT 1);
            
            RAISE NOTICE 'Update successful!';
        EXCEPTION WHEN OTHERS THEN
            constraint_error := SQLERRM;
            RAISE NOTICE 'Update failed with error: %', constraint_error;
        END;
    ELSE
        RAISE NOTICE 'User does not exist in users table';
    END IF;
END $$;

-- 7. Check for any triggers that might be interfering
SELECT 
    'Triggers' as check_type,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'maintenance_mode';

-- 8. Verify the user ID format and compare with auth.users
SELECT 
    'Auth vs Public Users Comparison' as check_type,
    'auth.users' as source,
    id,
    email,
    created_at
FROM auth.users 
WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25'
UNION ALL
SELECT 
    'public.users' as source,
    id,
    email,
    created_at
FROM users 
WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25';
