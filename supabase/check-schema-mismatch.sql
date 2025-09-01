-- Check Schema Mismatch for Maintenance Mode
-- This will identify any structural issues causing the foreign key constraint violation

-- 1. Check the exact structure of the users table
SELECT 'Users Table Structure' as check;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check the exact structure of the maintenance_mode table
SELECT 'Maintenance Mode Table Structure' as check;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'maintenance_mode' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check the foreign key constraint definition
SELECT 'Foreign Key Constraints' as check;
SELECT 
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
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'maintenance_mode';

-- 4. Check if the constraint is actually enforced
SELECT 'Constraint Enforcement Status' as check;
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as foreign_table_name,
    confupdtype as update_action,
    confdeltype as delete_action,
    confmatchtype as match_type
FROM pg_constraint 
WHERE conname = 'maintenance_mode_started_by_fkey';

-- 5. Check the exact data types being compared
SELECT 'Data Type Comparison' as check;
SELECT 
    'users.id' as column,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id'
UNION ALL
SELECT 
    'maintenance_mode.started_by' as column,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'maintenance_mode' AND column_name = 'started_by';

-- 6. Check if there are any triggers that might interfere
SELECT 'Triggers on maintenance_mode' as check;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'maintenance_mode';

-- 7. Check the exact values that are causing the issue
SELECT 'Current Values Analysis' as check;
SELECT 
    'users.id' as source,
    id,
    email,
    role
FROM users 
WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25'
UNION ALL
SELECT 
    'maintenance_mode.started_by' as source,
    started_by::text,
    'N/A' as email,
    'N/A' as role
FROM maintenance_mode 
WHERE id = (SELECT id FROM maintenance_mode ORDER BY id DESC LIMIT 1);

-- 8. Test the exact constraint violation
DO $$
DECLARE
    test_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    constraint_error TEXT;
BEGIN
    RAISE NOTICE 'Testing constraint with user ID: %', test_user_id;
    
    -- Check if user exists
    IF EXISTS(SELECT 1 FROM users WHERE id = test_user_id) THEN
        RAISE NOTICE 'User exists in users table';
        
        -- Try to insert a test record
        BEGIN
            INSERT INTO maintenance_mode (
                is_enabled,
                message,
                started_by,
                started_at,
                estimated_duration_minutes,
                created_at,
                updated_at
            ) VALUES (
                false,
                'Test message',
                test_user_id,
                NOW(),
                60,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'SUCCESS: Insert worked - constraint is fine';
            
            -- Clean up test record
            DELETE FROM maintenance_mode WHERE message = 'Test message';
            
        EXCEPTION WHEN OTHERS THEN
            constraint_error := SQLERRM;
            RAISE NOTICE 'ERROR: Insert failed with: %', constraint_error;
        END;
    ELSE
        RAISE NOTICE 'ERROR: User does not exist in users table';
    END IF;
END $$;
