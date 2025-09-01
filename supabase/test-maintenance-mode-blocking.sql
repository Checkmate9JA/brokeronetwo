-- Test Maintenance Mode Blocking
-- This script will verify that maintenance mode properly blocks non-super-admin users

-- 1. Check current maintenance mode status
SELECT 'Current Maintenance Mode Status' as test;
SELECT 
    is_enabled,
    message,
    started_at,
    started_by,
    estimated_duration_minutes
FROM maintenance_mode;

-- 2. Test the is_maintenance_mode_active function
SELECT 'Testing is_maintenance_mode_active function' as test;
SELECT is_maintenance_mode_active() as is_active;

-- 3. Test the get_maintenance_mode_info function
SELECT 'Testing get_maintenance_mode_info function' as test;
SELECT * FROM get_maintenance_mode_info();

-- 4. Check if there are any RLS policies that might interfere
SELECT 'Checking RLS policies' as test;
SELECT 
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'maintenance_mode';

-- 5. Verify the function permissions
SELECT 'Checking function permissions' as test;
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name IN ('is_maintenance_mode_active', 'get_maintenance_mode_info')
AND routine_schema = 'public';

-- 6. Test direct table access
SELECT 'Testing direct table access' as test;
SELECT COUNT(*) as record_count FROM maintenance_mode;

-- 7. Simulate what the React app would see
SELECT 'Simulating React app maintenance check' as test;
SELECT 
    CASE 
        WHEN is_enabled THEN 'MAINTENANCE MODE ACTIVE - BLOCK USERS'
        ELSE 'MAINTENANCE MODE INACTIVE - ALLOW USERS'
    END as status,
    is_enabled,
    message
FROM maintenance_mode;
