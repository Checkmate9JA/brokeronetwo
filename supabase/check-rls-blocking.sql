-- Check RLS Policies Blocking User Creation
-- This will identify if Row Level Security is preventing the user insert

-- 1. Check RLS status on users table
SELECT '=== RLS STATUS ON USERS TABLE ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Check all RLS policies on users table
SELECT '=== RLS POLICIES ON USERS TABLE ===' as info;
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
WHERE tablename = 'users';

-- 3. Check if there are any triggers on users table
SELECT '=== TRIGGERS ON USERS TABLE ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 4. Check the exact error when trying to insert
SELECT '=== TESTING INSERT WITH ERROR DETAILS ===' as info;

DO $$
DECLARE
    target_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    insert_result TEXT;
BEGIN
    RAISE NOTICE 'Attempting to insert user with ID: %', target_user_id;
    
    BEGIN
        -- Try the insert and capture any error
        INSERT INTO users (id, email, full_name, role) 
        VALUES (target_user_id, 'creativeco9ja@gmail.com', 'Super Admin User', 'super_admin');
        
        RAISE NOTICE '✅ SUCCESS: User inserted successfully';
        insert_result := 'SUCCESS';
        
    EXCEPTION 
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ ERROR: Insufficient privilege - %', SQLERRM;
            insert_result := 'INSUFFICIENT_PRIVILEGE';
        WHEN foreign_key_violation THEN
            RAISE NOTICE '❌ ERROR: Foreign key violation - %', SQLERRM;
            insert_result := 'FOREIGN_KEY_VIOLATION';
        WHEN unique_violation THEN
            RAISE NOTICE '❌ ERROR: Unique constraint violation - %', SQLERRM;
            insert_result := 'UNIQUE_VIOLATION';
        WHEN check_violation THEN
            RAISE NOTICE '❌ ERROR: Check constraint violation - %', SQLERRM;
            insert_result := 'CHECK_VIOLATION';
        WHEN not_null_violation THEN
            RAISE NOTICE '❌ ERROR: Not null constraint violation - %', SQLERRM;
            insert_result := 'NOT_NULL_VIOLATION';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERROR: Other error - %', SQLERRM;
            RAISE NOTICE 'Error code: %', SQLSTATE;
            insert_result := 'OTHER_ERROR: ' || SQLERRM;
    END;
    
    RAISE NOTICE 'Final insert result: %', insert_result;
END $$;

-- 5. Check if we can bypass RLS temporarily
SELECT '=== TESTING RLS BYPASS ===' as info;

-- Try to disable RLS temporarily for testing
DO $$
DECLARE
    rls_was_enabled BOOLEAN;
BEGIN
    -- Check if RLS is enabled
    SELECT rowsecurity INTO rls_was_enabled 
    FROM pg_tables 
    WHERE tablename = 'users';
    
    RAISE NOTICE 'RLS was enabled: %', rls_was_enabled;
    
    IF rls_was_enabled THEN
        -- Try to disable RLS temporarily
        BEGIN
            ALTER TABLE users DISABLE ROW LEVEL SECURITY;
            RAISE NOTICE '✅ SUCCESS: RLS disabled temporarily';
            
            -- Now try to insert
            INSERT INTO users (id, email, full_name, role) 
            VALUES ('c05ad157-eba7-4877-af8f-4a350f638b25', 'creativeco9ja@gmail.com', 'Super Admin User', 'super_admin');
            
            RAISE NOTICE '✅ SUCCESS: User inserted with RLS disabled';
            
            -- Re-enable RLS
            ALTER TABLE users ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE '✅ SUCCESS: RLS re-enabled';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ ERROR: Could not disable RLS or insert user: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'RLS was not enabled, trying direct insert...';
        
        BEGIN
            INSERT INTO users (id, email, full_name, role) 
            VALUES ('c05ad157-eba7-4877-af8f-4a350f638b25', 'creativeco9ja@gmail.com', 'Super Admin User', 'super_admin');
            
            RAISE NOTICE '✅ SUCCESS: User inserted without RLS';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ ERROR: Direct insert failed: %', SQLERRM;
        END;
    END IF;
END $$;

-- 6. Final verification
SELECT '=== FINAL VERIFICATION ===' as info;
SELECT 
    CASE WHEN EXISTS(SELECT 1 FROM users WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25') 
         THEN '✅ USER EXISTS in public.users' 
         ELSE '❌ USER STILL MISSING from public.users' 
    END as final_status;
