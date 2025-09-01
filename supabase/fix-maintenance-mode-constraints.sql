-- Fix Maintenance Mode Foreign Key Constraints
-- This script resolves issues with the maintenance_mode table foreign key constraints

-- 1. Check if maintenance_mode table exists and has data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_mode') THEN
        -- 2. Check if there are any invalid started_by references
        IF EXISTS (
            SELECT 1 FROM maintenance_mode mm 
            LEFT JOIN users u ON mm.started_by = u.id 
            WHERE mm.started_by IS NOT NULL AND u.id IS NULL
        ) THEN
            -- 3. Fix invalid references by setting started_by to NULL
            UPDATE maintenance_mode 
            SET started_by = NULL 
            WHERE started_by IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM users WHERE id = maintenance_mode.started_by);
            
            RAISE NOTICE 'Fixed invalid started_by references in maintenance_mode table';
        ELSE
            RAISE NOTICE 'No invalid started_by references found';
        END IF;
        
        -- 4. Ensure the table has at least one record
        IF NOT EXISTS (SELECT 1 FROM maintenance_mode) THEN
            INSERT INTO maintenance_mode (
                is_enabled, 
                message, 
                estimated_duration_minutes, 
                started_at, 
                started_by, 
                created_at, 
                updated_at
            ) VALUES (
                false, 
                'System is operational', 
                60, 
                NULL, 
                NULL, 
                NOW(), 
                NOW()
            );
            RAISE NOTICE 'Created default maintenance_mode record';
        END IF;
    ELSE
        RAISE NOTICE 'maintenance_mode table does not exist';
    END IF;
END $$;

-- 5. Verify the fix
SELECT 
    'maintenance_mode' as table_name,
    COUNT(*) as total_records,
    COUNT(started_by) as records_with_started_by,
    COUNT(CASE WHEN started_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE id = maintenance_mode.started_by) THEN 1 END) as invalid_references
FROM maintenance_mode;
