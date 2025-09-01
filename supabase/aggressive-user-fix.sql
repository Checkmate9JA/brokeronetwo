-- Aggressive User Fix for Maintenance Mode
-- This will completely resolve the foreign key constraint violation

-- 1. First, let's see what we have
SELECT 'Current Status' as step;
SELECT 'Users in public.users' as check, COUNT(*) as count FROM users;
SELECT 'Users in auth.users' as check, COUNT(*) as count FROM auth.users;

-- 2. Check if our specific user exists
SELECT 'User Check' as step;
SELECT 
    CASE WHEN EXISTS(SELECT 1 FROM users WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25') 
         THEN 'EXISTS in public.users' 
         ELSE 'MISSING from public.users' 
    END as status;

-- 3. If user doesn't exist, create it with ALL required fields
DO $$
DECLARE
    target_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = target_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Insert the missing user record with ALL fields
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

-- 5. Now let's fix the maintenance_mode table
SELECT 'Fixing maintenance_mode table' as step;

-- First, let's see what's in maintenance_mode
SELECT 'Current maintenance_mode records' as check, 
       id, is_enabled, message, started_by, started_at, estimated_duration_minutes 
FROM maintenance_mode;

-- Update maintenance_mode to use our user ID
UPDATE maintenance_mode 
SET started_by = 'c05ad157-eba7-4877-af8f-4a350f638b25',
    updated_at = NOW()
WHERE id = (SELECT id FROM maintenance_mode ORDER BY id DESC LIMIT 1);

-- 6. Test the exact operation that was failing
DO $$
DECLARE
    test_user_id UUID := 'c05ad157-eba7-4877-af8f-4a350f638b25';
    user_exists BOOLEAN;
    test_result TEXT;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = test_user_id) INTO user_exists;
    RAISE NOTICE 'User exists in public.users: %', user_exists;
    
    IF user_exists THEN
        -- Try to update maintenance_mode with this user
        BEGIN
            UPDATE maintenance_mode 
            SET started_by = test_user_id,
                updated_at = NOW()
            WHERE id = (SELECT id FROM maintenance_mode ORDER BY id DESC LIMIT 1);
            
            RAISE NOTICE 'SUCCESS: Maintenance mode update worked!';
            test_result := 'PASSED';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Update failed with: %', SQLERRM;
            test_result := 'FAILED: ' || SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'ERROR: User not found in public.users table';
        test_result := 'FAILED: User not found';
    END IF;
    
    RAISE NOTICE 'Final Test Result: %', test_result;
END $$;

-- 7. Final verification
SELECT 'Final Status Check' as step;
SELECT 'Maintenance mode records' as check, COUNT(*) as count FROM maintenance_mode;
SELECT 'Maintenance mode details' as check, 
       id, is_enabled, message, started_by, started_at, estimated_duration_minutes 
FROM maintenance_mode;

-- 8. Test the function that was failing
SELECT 'Testing get_maintenance_mode_info function' as step;
SELECT * FROM get_maintenance_mode_info();
