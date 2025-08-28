-- Storage Bucket Setup for Proof of Payment
-- This script sets up the necessary storage infrastructure for handling proof of payment files

-- 1. Create the storage bucket for proof of payment files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proof-of-payment',
  'proof-of-payment',
  false, -- Private bucket for security
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for the proof-of-payment bucket

-- Policy: Users can upload proof of payment files
CREATE POLICY "Users can upload proof of payment files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'proof-of-payment' AND
  auth.role() = 'authenticated'
);

-- Policy: Users can view their own proof of payment files
CREATE POLICY "Users can view their own proof of payment files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'proof-of-payment' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'email'
);

-- Policy: Users can update their own proof of payment files
CREATE POLICY "Users can update their own proof of payment files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'proof-of-payment' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'email'
);

-- Policy: Users can delete their own proof of payment files
CREATE POLICY "Users can delete their own proof of payment files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'proof-of-payment' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'email'
);

-- Policy: Admins can view all proof of payment files
CREATE POLICY "Admins can view all proof of payment files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'proof-of-payment' AND
  (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  )
);

-- Policy: Admins can update all proof of payment files
CREATE POLICY "Admins can update all proof of payment files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'proof-of-payment' AND
  (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  )
);

-- Policy: Admins can delete all proof of payment files
CREATE POLICY "Admins can delete all proof of payment files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'proof-of-payment' AND
  (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  )
);

-- 3. Create a helper function to generate file paths for proof of payment
CREATE OR REPLACE FUNCTION generate_proof_of_payment_path(
  user_email TEXT,
  transaction_id UUID,
  file_extension TEXT
) RETURNS TEXT AS $$
BEGIN
  -- Generate a unique path: user_email/transaction_id_timestamp.extension
  RETURN user_email || '/' || transaction_id::TEXT || '_' || 
         EXTRACT(EPOCH FROM NOW())::BIGINT || '.' || file_extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a function to validate file uploads
CREATE OR REPLACE FUNCTION validate_proof_of_payment_upload(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check file size (10MB limit)
  IF file_size > 10485760 THEN
    RAISE EXCEPTION 'File size exceeds 10MB limit';
  END IF;
  
  -- Check mime type
  IF mime_type NOT IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'image/svg+xml') THEN
    RAISE EXCEPTION 'Invalid file type. Only images and PDFs are allowed.';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a table to track proof of payment files
CREATE TABLE IF NOT EXISTS public.proof_of_payment_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proof_of_payment_files_transaction_id ON public.proof_of_payment_files(transaction_id);
CREATE INDEX IF NOT EXISTS idx_proof_of_payment_files_user_email ON public.proof_of_payment_files(user_email);
CREATE INDEX IF NOT EXISTS idx_proof_of_payment_files_status ON public.proof_of_payment_files(status);

-- 7. Create RLS policies for the proof_of_payment_files table
ALTER TABLE public.proof_of_payment_files ENABLE ROW LEVEL SECURITY;

-- Users can view their own proof of payment files
CREATE POLICY "Users can view their own proof of payment files" ON public.proof_of_payment_files
FOR SELECT USING (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Users can insert their own proof of payment files
CREATE POLICY "Users can insert their own proof of payment files" ON public.proof_of_payment_files
FOR INSERT WITH CHECK (user_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Users can update their own proof of payment files (only if status is pending)
CREATE POLICY "Users can update their own pending proof of payment files" ON public.proof_of_payment_files
FOR UPDATE USING (
  user_email = (SELECT email FROM public.users WHERE id = auth.uid()) AND
  status = 'pending'
);

-- Admins can view all proof of payment files
CREATE POLICY "Admins can view all proof of payment files" ON public.proof_of_payment_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Admins can update all proof of payment files
CREATE POLICY "Admins can update all proof of payment files" ON public.proof_of_payment_files
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Admins can delete all proof of payment files
CREATE POLICY "Admins can delete all proof of payment files" ON public.proof_of_payment_files
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- 8. Create a trigger to update the updated_at column
CREATE TRIGGER update_proof_of_payment_files_updated_at 
  BEFORE UPDATE ON public.proof_of_payment_files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON public.proof_of_payment_files TO authenticated;
GRANT ALL ON public.proof_of_payment_files TO service_role;

-- 10. Create a function to get signed URLs for proof of payment files
CREATE OR REPLACE FUNCTION get_proof_of_payment_url(
  file_path TEXT,
  expires_in_seconds INTEGER DEFAULT 3600
) RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- This function will be called from the client side
  -- The actual signed URL generation happens in the client using Supabase client
  RETURN 'proof-of-payment/' || file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
