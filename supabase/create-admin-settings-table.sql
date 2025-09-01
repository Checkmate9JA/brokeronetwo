-- Create admin_settings table for storing application-wide settings
-- This table will store various admin configurations including trading loss settings

DO $$ 
BEGIN
    -- Create admin_settings table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_settings') THEN
        CREATE TABLE admin_settings (
            id SERIAL PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created admin_settings table';
    ELSE
        RAISE NOTICE 'admin_settings table already exists';
    END IF;
    
    -- Insert default trading loss settings if they don't exist
    INSERT INTO admin_settings (setting_key, setting_value, description) 
    VALUES 
        ('user_loss_percentage', '3', 'Default percentage of user investment that will be lost over time'),
        ('enforce_user_loss_percentage', 'true', 'Whether to enforce the user loss percentage setting'),
        ('global_loss_control', 'true', 'Master switch for admin-controlled trading losses')
    ON CONFLICT (setting_key) DO NOTHING;
    
    RAISE NOTICE 'Inserted default trading loss settings';
    
    -- Create index on setting_key for faster lookups
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'admin_settings_setting_key_idx') THEN
        CREATE INDEX admin_settings_setting_key_idx ON admin_settings(setting_key);
        RAISE NOTICE 'Created index on admin_settings.setting_key';
    ELSE
        RAISE NOTICE 'Index on admin_settings.setting_key already exists';
    END IF;
    
END $$;
