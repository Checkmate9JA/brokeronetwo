-- Fix Maintenance Mode Default State to Disabled
-- This ensures Super Admin meets maintenance mode disabled by default

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

-- 3. If no records exist, create one with disabled state
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM maintenance_mode) THEN
        INSERT INTO maintenance_mode (
            is_enabled,
            message,
            started_by,
            started_at,
            estimated_duration_minutes,
            created_at,
            updated_at
        ) VALUES (
            false,
            'System is currently under maintenance. Please check back later.',
            NULL,
            NULL,
            60,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created new maintenance mode record with disabled state';
    END IF;
END $$;
