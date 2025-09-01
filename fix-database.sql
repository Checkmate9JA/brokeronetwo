-- Fix Database: Add preferred_currency column to users table
-- Run this in your Supabase SQL Editor

-- Step 1: Add the preferred_currency column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'USD';

-- Step 2: Update existing users to have USD as default
UPDATE public.users 
SET preferred_currency = 'USD' 
WHERE preferred_currency IS NULL;

-- Step 3: Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name = 'preferred_currency';

-- Step 4: Check current user data
SELECT 
    id, 
    email, 
    full_name, 
    preferred_currency,
    created_at
FROM public.users 
LIMIT 10;
