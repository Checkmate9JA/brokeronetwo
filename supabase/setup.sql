-- BrokerOne Supabase Complete Setup Script
-- IMPORTANT: Copy and paste the contents of each section below into your Supabase SQL Editor

-- ========================================
-- SECTION 1: SCHEMA SETUP
-- ========================================
-- Copy and paste the contents of supabase/schema.sql here
-- (The entire schema.sql file content goes here)

-- ========================================
-- SECTION 2: RLS POLICIES
-- ========================================
-- Copy and paste the contents of supabase/rls_policies.sql here
-- (The entire rls_policies.sql file content goes here)

-- ========================================
-- SECTION 3: FUNCTIONS AND TRIGGERS
-- ========================================
-- Copy and paste the contents of supabase/functions.sql here
-- (The entire functions.sql file content goes here)

-- ========================================
-- SECTION 4: INITIAL DATA
-- ========================================
-- Copy and paste the contents of supabase/initial_data.sql here
-- (The entire initial_data.sql file content goes here)

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify your setup:

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check functions
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Final status
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';
SELECT COUNT(*) as total_functions FROM information_schema.routines WHERE routine_schema = 'public';
