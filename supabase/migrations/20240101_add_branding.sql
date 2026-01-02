
-- Add logo columns to dashboard_settings
ALTER TABLE dashboard_settings 
ADD COLUMN IF NOT EXISTS logo_path text,
ADD COLUMN IF NOT EXISTS agency_logo_path text;

-- Create branding bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for branding bucket
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'branding' );

-- Allow authenticated uploads (we can refine this later to strictly agency if needed, but for now authenticated is good baseline)
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'branding' );

CREATE POLICY "Authenticated Updates"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'branding' );
