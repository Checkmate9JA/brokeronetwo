-- Clean Maintenance Mode Setup
-- This script can be run multiple times without errors

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read maintenance mode" ON maintenance_mode;
DROP POLICY IF EXISTS "Allow only super admins to update maintenance mode" ON maintenance_mode;
DROP POLICY IF EXISTS "Allow only super admins to insert maintenance mode" ON maintenance_mode;

-- 2. Drop existing functions
DROP FUNCTION IF EXISTS is_maintenance_mode_active();
DROP FUNCTION IF EXISTS get_maintenance_mode_info();
DROP FUNCTION IF EXISTS toggle_maintenance_mode(BOOLEAN, TEXT, INTEGER, UUID);

-- 3. Drop existing table (if you want a fresh start)
-- DROP TABLE IF EXISTS maintenance_mode CASCADE;

-- 4. Create table if not exists
CREATE TABLE IF NOT EXISTS maintenance_mode (
    id SERIAL PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT false,
    message TEXT DEFAULT 'System is under maintenance. Please check back later.',
    started_at TIMESTAMP WITH TIME ZONE,
    started_by UUID REFERENCES users(id),
    estimated_duration_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert default record if table is empty
INSERT INTO maintenance_mode (is_enabled, message, estimated_duration_minutes)
SELECT false, 'System is operational', 60
WHERE NOT EXISTS (SELECT 1 FROM maintenance_mode);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_mode_enabled ON maintenance_mode(is_enabled);

-- 7. Create functions
CREATE OR REPLACE FUNCTION is_maintenance_mode_active()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM maintenance_mode 
        WHERE is_enabled = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_maintenance_mode_info()
RETURNS TABLE(
    is_enabled BOOLEAN,
    message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    started_by UUID,
    estimated_duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mm.is_enabled,
        mm.message,
        mm.started_at,
        mm.started_by,
        mm.estimated_duration_minutes
    FROM maintenance_mode mm
    ORDER BY mm.id DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_maintenance_mode(
    new_status BOOLEAN,
    maintenance_message TEXT DEFAULT NULL,
    duration_minutes INTEGER DEFAULT 60,
    user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- ONLY allow super admins to toggle maintenance mode
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions. Only Super Admins can control maintenance mode.';
    END IF;

    -- Validate duration (allow -1 for indefinite, or 1-1440 for timed)
    IF duration_minutes != -1 AND (duration_minutes < 1 OR duration_minutes > 1440) THEN
        RAISE EXCEPTION 'Duration must be -1 (indefinite) or between 1 and 1440 minutes';
    END IF;

    -- Update maintenance mode
    UPDATE maintenance_mode 
    SET 
        is_enabled = new_status,
        message = COALESCE(maintenance_message, message),
        estimated_duration_minutes = duration_minutes,
        started_at = CASE WHEN new_status THEN NOW() ELSE started_at END,
        started_by = CASE WHEN new_status AND user_id IS NOT NULL THEN user_id ELSE started_by END,
        updated_at = NOW()
    WHERE id = (SELECT id FROM maintenance_mode ORDER BY id DESC LIMIT 1);

    RETURN new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permissions
GRANT SELECT ON maintenance_mode TO authenticated;
GRANT EXECUTE ON FUNCTION is_maintenance_mode_active() TO authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_mode_info() TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_maintenance_mode(BOOLEAN, TEXT, INTEGER, UUID) TO authenticated;

-- 9. Create RLS policies
CREATE POLICY "Allow authenticated users to read maintenance mode"
ON maintenance_mode FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow only super admins to update maintenance mode"
ON maintenance_mode FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'super_admin'
    )
);

CREATE POLICY "Allow only super admins to insert maintenance mode"
ON maintenance_mode FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'super_admin'
    )
);

-- 10. Enable RLS
ALTER TABLE maintenance_mode ENABLE ROW LEVEL SECURITY;

-- 11. Verify setup
SELECT 
    'Setup Complete' as status,
    COUNT(*) as maintenance_records,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'maintenance_mode') as policies_created
FROM maintenance_mode;
