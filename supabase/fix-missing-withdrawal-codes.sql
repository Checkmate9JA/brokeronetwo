-- Fix missing withdrawal codes for existing users
-- This script ensures all existing users have withdrawal codes

-- Update users who don't have withdrawal codes
UPDATE public.users 
SET withdrawal_code = generate_withdrawal_code()
WHERE withdrawal_code IS NULL OR withdrawal_code = '';

-- Verify the update
SELECT 
    email, 
    full_name, 
    withdrawal_code,
    CASE 
        WHEN withdrawal_code IS NULL OR withdrawal_code = '' 
        THEN 'MISSING' 
        ELSE 'OK' 
    END as status
FROM public.users 
ORDER BY created_at;

-- Show count of users with and without codes
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN withdrawal_code IS NOT NULL AND withdrawal_code != '' THEN 1 END) as users_with_codes,
    COUNT(CASE WHEN withdrawal_code IS NULL OR withdrawal_code = '' THEN 1 END) as users_without_codes
FROM public.users;

