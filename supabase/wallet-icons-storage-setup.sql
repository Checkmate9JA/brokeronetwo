-- Storage Bucket Setup for Wallet Icons
-- This script sets up the necessary storage infrastructure for handling wallet icon uploads

-- 1. Create the storage bucket for wallet icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wallet-icons',
  'wallet-icons',
  true, -- Public bucket for wallet icons (they need to be accessible)
  5242880, -- 5MB file size limit (icons don't need to be huge)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for the wallet-icons bucket

-- Policy: Authenticated users can upload wallet icons
CREATE POLICY "Authenticated users can upload wallet icons" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'wallet-icons' AND
  auth.role() = 'authenticated'
);

-- Policy: Anyone can view wallet icons (public access)
CREATE POLICY "Anyone can view wallet icons" ON storage.objects
FOR SELECT USING (
  bucket_id = 'wallet-icons'
);

-- Policy: Users can update their own uploaded wallet icons
CREATE POLICY "Users can update their own wallet icons" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'wallet-icons' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'email'
);

-- Policy: Users can delete their own uploaded wallet icons
CREATE POLICY "Users can delete their own wallet icons" ON storage.objects
FOR DELETE USING (
  bucket_id = 'wallet-icons' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'email'
);

-- Policy: Admins can manage all wallet icons
CREATE POLICY "Admins can manage all wallet icons" ON storage.objects
FOR ALL USING (
  bucket_id = 'wallet-icons' AND
  (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  )
);

-- 3. Create a helper function to generate file paths for wallet icons
CREATE OR REPLACE FUNCTION generate_wallet_icon_path(
  user_email TEXT,
  wallet_name TEXT,
  file_extension TEXT
) RETURNS TEXT AS $$
BEGIN
  -- Generate a unique path: user_email/wallet_name_timestamp.extension
  -- Sanitize wallet name to remove special characters
  RETURN user_email || '/' || 
         regexp_replace(wallet_name, '[^a-zA-Z0-9_-]', '_', 'g') || '_' || 
         EXTRACT(EPOCH FROM NOW())::BIGINT || '.' || file_extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a function to validate wallet icon uploads
CREATE OR REPLACE FUNCTION validate_wallet_icon_upload(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check file size (5MB limit)
  IF file_size > 5242880 THEN
    RAISE EXCEPTION 'File size exceeds 5MB limit';
  END IF;
  
  -- Check mime type
  IF mime_type NOT IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml') THEN
    RAISE EXCEPTION 'Invalid file type. Only images are allowed.';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a table to track wallet icon files
CREATE TABLE IF NOT EXISTS public.wallet_icon_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_id UUID REFERENCES public.managed_wallets(id) ON DELETE CASCADE, -- Made nullable for new uploads
  user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_icon_files_wallet_id ON public.wallet_icon_files(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_icon_files_user_email ON public.wallet_icon_files(user_email);
CREATE INDEX IF NOT EXISTS idx_wallet_icon_files_is_active ON public.wallet_icon_files(is_active);

-- 7. Create RLS policies for the wallet_icon_files table
ALTER TABLE public.wallet_icon_files ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet icon files
CREATE POLICY "Users can view their own wallet icon files" ON public.wallet_icon_files
FOR SELECT USING (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Users can insert their own wallet icon files
CREATE POLICY "Users can insert their own wallet icon files" ON public.wallet_icon_files
FOR INSERT WITH CHECK (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Users can update their own wallet icon files
CREATE POLICY "Users can update their own wallet icon files" ON public.wallet_icon_files
FOR UPDATE USING (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Users can delete their own wallet icon files
CREATE POLICY "Users can delete their own wallet icon files" ON public.wallet_icon_files
FOR DELETE USING (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Admins can view all wallet icon files
CREATE POLICY "Admins can view all wallet icon files" ON public.wallet_icon_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Admins can update all wallet icon files
CREATE POLICY "Admins can update all wallet icon files" ON public.wallet_icon_files
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Admins can delete all wallet icon files
CREATE POLICY "Admins can delete all wallet icon files" ON public.wallet_icon_files
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- 8. Create a trigger to update the updated_at column
CREATE TRIGGER update_wallet_icon_files_updated_at 
  BEFORE UPDATE ON public.wallet_icon_files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON public.wallet_icon_files TO authenticated;
GRANT ALL ON public.wallet_icon_files TO service_role;

-- 10. Create a function to get public URLs for wallet icons
CREATE OR REPLACE FUNCTION get_wallet_icon_url(
  file_path TEXT
) RETURNS TEXT AS $$
BEGIN
  -- Return the public URL for wallet icons
  RETURN 'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/wallet-icons/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create a function to deactivate old wallet icons when a new one is uploaded
CREATE OR REPLACE FUNCTION deactivate_old_wallet_icons()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new wallet icon is uploaded, deactivate all previous icons for the same wallet
  -- Only if wallet_id is not null
  IF NEW.wallet_id IS NOT NULL THEN
    UPDATE public.wallet_icon_files 
    SET is_active = FALSE 
    WHERE wallet_id = NEW.wallet_id 
    AND id != NEW.id 
    AND is_active = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to automatically deactivate old wallet icons
CREATE TRIGGER deactivate_old_wallet_icons_trigger
  AFTER INSERT ON public.wallet_icon_files
  FOR EACH ROW EXECUTE FUNCTION deactivate_old_wallet_icons();

-- 13. Update the managed_wallets table to reference the icon file
ALTER TABLE public.managed_wallets 
ADD COLUMN IF NOT EXISTS icon_file_id UUID REFERENCES public.wallet_icon_files(id);

-- 14. Create an index for the icon_file_id
CREATE INDEX IF NOT EXISTS idx_managed_wallets_icon_file_id ON public.managed_wallets(icon_file_id);

-- 15. Grant storage permissions explicitly
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
