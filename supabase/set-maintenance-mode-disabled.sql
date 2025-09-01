-- Set Maintenance Mode to Disabled by Default
-- This ensures Super Admin meets maintenance mode disabled initially

-- 1. Update the existing record to be disabled
UPDATE maintenance_mode 
SET is_enabled = false,
    message = 'System is currently under maintenance. Please check back later.',
    started_by = NULL,
    started_at = NULL,
    estimated_duration_minutes = 60,
    updated_at = NOW()
WHERE id = (SELECT id FROM maintenance_mode ORDER BY id DESC LIMIT 1);

-- 2. Verify the change
SELECT 'Maintenance Mode Status' as check,
       is_enabled,
       message,
       started_by,
       started_at,
       estimated_duration_minutes,
       updated_at
FROM maintenance_mode;

-- 3. Test that maintenance mode is now disabled
SELECT 'Testing is_maintenance_mode_active function' as test;
SELECT is_maintenance_mode_active() as is_active;
