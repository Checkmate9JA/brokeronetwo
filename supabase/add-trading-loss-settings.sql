-- Add Trading Loss Settings to Admin Settings
-- This allows admins to control the percentage of money users must lose in trades

-- Insert default user loss percentage setting
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
    ('user_loss_percentage', '3')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Insert trading loss enforcement setting
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
    ('enforce_user_loss_percentage', 'true')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Insert global loss control setting
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
    ('global_loss_control', 'true')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Verify the settings were added
SELECT 'Trading Loss Settings Added' as status;
SELECT setting_key, setting_value, created_at, updated_at 
FROM public.admin_settings 
WHERE setting_key IN ('user_loss_percentage', 'enforce_user_loss_percentage', 'global_loss_control')
ORDER BY setting_key;
