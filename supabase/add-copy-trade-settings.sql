-- Add Copy Trade Settings to Admin Settings
-- This allows admins to control minimum copy trade amounts

-- Insert copy trade minimum amount setting
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
    ('min_copy_trade_amount', '50')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Insert copy trade enabled setting
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
    ('copy_trade_enabled', 'true')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Verify the settings were added
SELECT 'Copy Trade Settings Added' as status;
SELECT setting_key, setting_value, created_at, updated_at 
FROM public.admin_settings 
WHERE setting_key IN ('min_copy_trade_amount', 'copy_trade_enabled')
ORDER BY setting_key;
