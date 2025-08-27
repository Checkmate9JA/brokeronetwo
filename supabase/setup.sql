-- BrokerOne Supabase Complete Setup Script
-- Run this file in your Supabase SQL Editor to set up the entire database

-- This script will execute all the necessary SQL commands to set up your BrokerOne database
-- It includes: schema creation, RLS policies, functions, triggers, and initial data

-- IMPORTANT: Run this script in your Supabase SQL Editor
-- The script will create all tables, policies, and sample data automatically

-- Step 1: Run the main schema
\i supabase/schema.sql

-- Step 2: Set up RLS policies  
\i supabase/rls_policies.sql

-- Step 3: Create functions and triggers
\i supabase/functions.sql

-- Step 4: Insert initial data
\i supabase/initial_data.sql

-- Step 5: Verify setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';
