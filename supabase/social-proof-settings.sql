-- Social Proof Settings Table
-- This table allows Super Admins to control social proof system settings

CREATE TABLE IF NOT EXISTS social_proof_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    is_enabled BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO social_proof_settings (setting_key, setting_value, is_enabled, description) VALUES
    ('system_enabled', 'true', true, 'Master switch for social proof system'),
    ('notification_frequency', '8-15', true, 'Notification frequency range in seconds'),
    ('max_notifications', '3', true, 'Maximum number of notifications to show'),
    ('auto_cleanup_days', '30', true, 'Days before activities are automatically cleaned up'),
    ('refresh_timestamps', 'false', true, 'Whether to refresh activity timestamps automatically'),
    ('deactivate_old_names_days', '90', true, 'Days before names are automatically deactivated')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to get social proof setting value
CREATE OR REPLACE FUNCTION get_social_proof_setting(setting_key_param VARCHAR)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT setting_value INTO setting_value
    FROM social_proof_settings
    WHERE setting_key = setting_key_param AND is_enabled = true;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update social proof setting
CREATE OR REPLACE FUNCTION update_social_proof_setting(
    setting_key_param VARCHAR,
    new_value TEXT,
    new_enabled BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    IF new_enabled IS NOT NULL THEN
        UPDATE social_proof_settings
        SET setting_value = new_value, 
            is_enabled = new_enabled,
            updated_at = NOW()
        WHERE setting_key = setting_key_param;
    ELSE
        UPDATE social_proof_settings
        SET setting_value = new_value,
            updated_at = NOW()
        WHERE setting_key = setting_key_param;
    END IF;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON social_proof_settings TO authenticated;
GRANT EXECUTE ON FUNCTION get_social_proof_setting TO authenticated;
GRANT EXECUTE ON FUNCTION update_social_proof_setting TO authenticated;
