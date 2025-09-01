-- Direct User Check and Force Create
-- This will bypass any permission issues and directly create the user

-- 1. First, let's see exactly what we have
SELECT '=== CURRENT DATABASE STATE ===' as info;

-- Check users table
SELECT 'Users Table Count' as check, COUNT(*) as count FROM users;
SELECT 'Users Table Sample' as check, id, email, role FROM users LIMIT 5;

-- Check auth.users table
SELECT 'Auth Users Count' as check, COUNT(*) as count FROM auth.users;
SELECT 'Auth Users Sample' as check, id, email, created_at FROM auth.users LIMIT 5;

-- 2. Check if our specific user exists anywhere
SELECT '=== USER EXISTENCE CHECK ===' as info;
SELECT 
    'public.users' as table_name,
    CASE WHEN EXISTS(SELECT 1 FROM users WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25') 
         THEN 'EXISTS' 
         ELSE 'MISSING' 
    END as status
UNION ALL
SELECT 
    'auth.users' as table_name,
    CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25') 
         THEN 'EXISTS' 
         ELSE 'MISSING' 
    END as status;

-- 3. Check the exact structure of users table
SELECT '=== USERS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Force create the user record (bypass any permission issues)
SELECT '=== FORCE CREATING USER ===' as info;

-- First, let's try to see if there are any permission issues
DO $$
DECLARE
    target_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    user_exists BOOLEAN;
    insert_result TEXT;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = target_user_id) INTO user_exists;
    RAISE NOTICE 'User exists in public.users: %', user_exists;
    
    IF NOT user_exists THEN
        -- Try to insert with minimal fields first
        BEGIN
            INSERT INTO users (id, email, full_name, role) 
            VALUES (target_user_id, 'creativeco9ja@gmail.com', 'Super Admin User', 'super_admin');
            
            RAISE NOTICE 'SUCCESS: User created with minimal fields';
            insert_result := 'SUCCESS - Minimal fields';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR with minimal fields: %', SQLERRM;
            insert_result := 'FAILED - Minimal fields: ' || SQLERRM;
            
            -- Try with just the essential fields
            BEGIN
                INSERT INTO users (id, email, role) 
                VALUES (target_user_id, 'creativeco9ja@gmail.com', 'super_admin');
                
                RAISE NOTICE 'SUCCESS: User created with just id, email, role';
                insert_result := 'SUCCESS - Essential fields only';
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'ERROR with essential fields: %', SQLERRM;
                insert_result := 'FAILED - Essential fields: ' || SQLERRM;
            END;
        END;
    ELSE
        RAISE NOTICE 'User already exists, no need to create';
        insert_result := 'ALREADY EXISTS';
    END IF;
    
    RAISE NOTICE 'Final Result: %', insert_result;
END $$;

-- 5. Verify the user was created
SELECT '=== VERIFICATION ===' as info;
SELECT 
    CASE WHEN EXISTS(SELECT 1 FROM users WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25') 
         THEN '✅ USER EXISTS in public.users' 
         ELSE '❌ USER STILL MISSING from public.users' 
    END as verification_result;

-- 6. Show the user record if it exists
SELECT '=== USER RECORD DETAILS ===' as info;
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    created_at 
FROM users 
WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25';

-- 7. If user exists, test the maintenance mode update
DO $$
DECLARE
    test_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM users WHERE id = test_user_id) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE '✅ User exists, testing maintenance mode update...';
        
        -- Try to update maintenance_mode
        BEGIN
            UPDATE maintenance_mode 
            SET started_by = test_user_id,
                updated_at = NOW()
            WHERE id = (SELECT id FROM maintenance_mode ORDER BY id DESC LIMIT 1);
            
            RAISE NOTICE '✅ SUCCESS: Maintenance mode update worked!';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ ERROR: Maintenance mode update failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ User still does not exist, cannot test maintenance mode';
    END IF;
END $$;
