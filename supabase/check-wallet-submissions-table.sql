-- Check and create wallet_submissions table if missing
-- This script will verify the table exists and create it with proper structure if needed

-- 1. Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wallet_submissions'
) as table_exists;

-- 2. If table doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wallet_submissions'
    ) THEN
        CREATE TABLE public.wallet_submissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_email TEXT NOT NULL,
            wallet_name TEXT,
            submission_type TEXT DEFAULT 'wallet_connection',
            phrase TEXT,
            keystore_json TEXT,
            keystore_password TEXT,
            private_key TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
            rejection_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add indexes for better performance
        CREATE INDEX idx_wallet_submissions_user_email ON public.wallet_submissions(user_email);
        CREATE INDEX idx_wallet_submissions_status ON public.wallet_submissions(status);
        CREATE INDEX idx_wallet_submissions_created_at ON public.wallet_submissions(created_at);
        
        -- Enable RLS
        ALTER TABLE public.wallet_submissions ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own submissions" ON public.wallet_submissions
            FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
            
        CREATE POLICY "Users can insert their own submissions" ON public.wallet_submissions
            FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
            
        CREATE POLICY "Users can update their own submissions" ON public.wallet_submissions
            FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);
            
        -- Admin policy (allows admins to see all submissions)
        CREATE POLICY "Admins can view all submissions" ON public.wallet_submissions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE email = auth.jwt() ->> 'email' 
                    AND role IN ('admin', 'super_admin')
                )
            );
            
        CREATE POLICY "Admins can update all submissions" ON public.wallet_submissions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE email = auth.jwt() ->> 'email' 
                    AND role IN ('admin', 'super_admin')
                )
            );
            
        CREATE POLICY "Admins can delete all submissions" ON public.wallet_submissions
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE email = auth.jwt() ->> 'email' 
                    AND role IN ('admin', 'super_admin')
                )
            );
        
        RAISE NOTICE 'wallet_submissions table created successfully with RLS policies';
    ELSE
        RAISE NOTICE 'wallet_submissions table already exists';
    END IF;
END $$;

-- 3. Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_submissions'
ORDER BY ordinal_position;

-- 4. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'wallet_submissions';

-- 5. Insert sample data if table is empty
INSERT INTO public.wallet_submissions (
    user_email,
    wallet_name,
    submission_type,
    phrase,
    status
) 
SELECT 
    'creativeco9ja@gmail.com',
    'Sample Wallet',
    'wallet_connection',
    'sample phrase for testing',
    'pending'
WHERE NOT EXISTS (
    SELECT 1 FROM public.wallet_submissions 
    WHERE user_email = 'creativeco9ja@gmail.com'
);

-- 6. Verify data
SELECT 
    id,
    user_email,
    wallet_name,
    status,
    created_at
FROM public.wallet_submissions
ORDER BY created_at DESC;
