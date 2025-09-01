-- Create chat_settings table for WhatsApp and LiveChat configuration
CREATE TABLE IF NOT EXISTS public.chat_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_type TEXT NOT NULL CHECK (setting_type IN ('whatsapp', 'livechat')),
    is_enabled BOOLEAN DEFAULT true,
    value TEXT, -- For WhatsApp: phone number, for LiveChat: script content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(setting_type)
);

-- Enable RLS
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read chat settings" ON public.chat_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow super admins to manage chat settings" ON public.chat_settings
    FOR ALL USING (auth.role() = 'super_admin');

-- Insert default settings only if they don't exist
INSERT INTO public.chat_settings (setting_type, is_enabled, value)
SELECT 'whatsapp', false, ''
WHERE NOT EXISTS (SELECT 1 FROM public.chat_settings WHERE setting_type = 'whatsapp');

INSERT INTO public.chat_settings (setting_type, is_enabled, value)
SELECT 'livechat', false, ''
WHERE NOT EXISTS (SELECT 1 FROM public.chat_settings WHERE setting_type = 'livechat');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_chat_settings_updated_at ON public.chat_settings;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_chat_settings_updated_at 
    BEFORE UPDATE ON public.chat_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
