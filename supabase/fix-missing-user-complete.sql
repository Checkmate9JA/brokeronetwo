-- Complete Fix for Missing User Record and Maintenance Mode
-- This will solve the foreign key constraint violation once and for all

-- 1. First, let's check what we have
SELECT 'Current Status Check' as step;
SELECT 'Users in public.users' as check, COUNT(*) as count FROM users;
SELECT 'Users in auth.users' as check, COUNT(*) as count FROM auth.users;

-- 2. Check if our specific user exists in either table
SELECT 'User in public.users' as check, 
       CASE WHEN EXISTS(SELECT 1 FROM users WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

SELECT 'User in auth.users' as check, 
       CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 3. Create the missing user record in public.users
DO $$
DECLARE
    target_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    user_exists BOOLEAN;
BEGIN
    -- Check if user already exists in public.users
    SELECT EXISTS(SELECT 1 FROM users WHERE id = target_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Insert the missing user record
        INSERT INTO users (
            id,
            email,
            full_name,
            role,
            total_balance,
            deposit_wallet,
            profit_wallet,
            trading_wallet,
            referrer_bonus,
            is_suspended,
            withdrawal_code,
            withdrawal_option,
            wallet_activated,
            avatar_url,
            created_at,
            updated_at
        ) VALUES (
            target_user_id,
            'creativeco9ja@gmail.com',
            'Super Admin User',
            'super_admin',
            6057589,
            572890,
            4995000,
            489699,
            0,
            false,
            '2DEW20',
            'withdrawal_code',
            false,
            null,
            '2025-08-27T00:54:50.96786+00:00'::timestamptz,
            '2025-08-30T10:10:18.982287+00:00'::timestamptz
        );
        
        RAISE NOTICE 'SUCCESS: User record created in public.users';
    ELSE
        RAISE NOTICE 'User already exists in public.users';
    END IF;
END $$;

-- 4. Verify the user was created
SELECT 'Verification' as step;
SELECT 'User record in public.users' as check, 
       id, email, full_name, role, created_at 
FROM users 
WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25';

-- 5. Test the maintenance mode update that was failing
DO $$
DECLARE
    test_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = test_user_id) INTO user_exists;
    RAISE NOTICE 'User exists in public.users: %', user_exists;
    
    IF user_exists THEN
        -- Try the exact update that was failing
        BEGIN
            UPDATE maintenance_mode 
            SET started_by = test_user_id,
                updated_at = NOW()
            WHERE id = (SELECT id FROM maintenance_mode ORDER BY id DESC LIMIT 1);
            RAISE NOTICE 'SUCCESS: Maintenance mode update worked! Foreign key constraint satisfied.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Update still failed with: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'ERROR: User still not found in public.users table';
    END IF;
END $$;

-- 6. Final verification - check maintenance mode status
SELECT 'Final Status Check' as step;
SELECT 'Maintenance mode records' as check, COUNT(*) as count FROM maintenance_mode;
SELECT 'Maintenance mode details' as check, 
       id, is_enabled, message, started_by, started_at, estimated_duration_minutes 
FROM maintenance_mode;

-- 7. Test the function that was failing
SELECT 'Testing get_maintenance_mode_info function' as step;
SELECT * FROM get_maintenance_mode_info();
