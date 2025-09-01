-- Test Maintenance Mode System
-- Run this to verify everything is working

-- 1. Check if table exists and has data
SELECT 
    'Table Status' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_mode') as table_exists,
    (SELECT COUNT(*) FROM maintenance_mode) as record_count;

-- 2. Check if functions exist
SELECT 
    'Functions Status' as check_type,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'is_maintenance_mode_active') as function_1_exists,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_maintenance_mode_info') as function_2_exists,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'toggle_maintenance_mode') as function_3_exists;

-- 3. Check if policies exist
SELECT 
    'Policies Status' as check_type,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'maintenance_mode') as policy_count;

-- 4. Test the functions (if you have super_admin role)
-- SELECT is_maintenance_mode_active() as maintenance_active;
-- SELECT * FROM get_maintenance_mode_info();

-- 5. Check current maintenance mode status
SELECT 
    'Current Status' as check_type,
    is_enabled,
    message,
    started_at,
    started_by,
    estimated_duration_minutes,
    created_at,
    updated_at
FROM maintenance_mode
ORDER BY id DESC
LIMIT 1;

-- 6. Check RLS status
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'maintenance_mode';
