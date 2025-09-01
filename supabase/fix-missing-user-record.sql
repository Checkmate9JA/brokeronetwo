-- Fix Missing User Record
-- This script resolves the foreign key constraint violation by ensuring the user exists

-- 1. Check if the user exists in auth.users
SELECT 
    'Auth Users Check' as check_type,
    COUNT(*) as auth_users_count,
    EXISTS(SELECT 1 FROM auth.users WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25') as target_user_exists_in_auth
FROM auth.users;

-- 2. Check if the user exists in public.users table
SELECT 
    'Public Users Check' as check_type,
    COUNT(*) as public_users_count,
    EXISTS(SELECT 1 FROM users WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25') as target_user_exists_in_public
FROM users;

-- 3. If the user exists in auth but not in public.users, create the record
DO $$
BEGIN
    IF EXISTS(
        SELECT 1 FROM auth.users 
        WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25'
    ) AND NOT EXISTS(
        SELECT 1 FROM users 
        WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25'
    ) THEN
        
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
            'c05ad157-eba7-4877-af8f-4a350f638b25',
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
            '2025-08-27T00:54:50.96786+00:00'::timestamp with time zone,
            '2025-08-30T10:10:18.982287+00:00'::timestamp with time zone
        );
        
        RAISE NOTICE 'Created missing user record for ID: c05ad157-eba7-4877-af8f-4a350f638b25';
    ELSE
        RAISE NOTICE 'User record already exists or auth user not found';
    END IF;
END $$;

-- 4. Verify the fix
SELECT 
    'Verification' as check_type,
    id,
    email,
    full_name,
    role,
    created_at
FROM users 
WHERE id = 'c05ad157-eba7-4877-af8f-4a350f638b25';

-- 5. Check if maintenance_mode can now reference this user
SELECT 
    'Maintenance Mode Check' as check_type,
    COUNT(*) as maintenance_records,
    COUNT(CASE WHEN started_by = 'c05ad157-eba7-4877-af8f-4a350f638b25' THEN 1 END) as records_with_target_user
FROM maintenance_mode;
