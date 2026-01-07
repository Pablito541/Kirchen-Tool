-- Enable RLS
ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Policy for Agencies to insert/update/delete their own settings or settings for their clients
-- Assuming agency_id column exists and links to auth.users or profiles
CREATE POLICY "Agencies can manage dashboard settings"
ON dashboard_settings
FOR ALL
USING (auth.uid() = agency_id)
WITH CHECK (auth.uid() = agency_id);

-- Policy for Clients to read their own settings
CREATE POLICY "Clients can read their own dashboard settings"
ON dashboard_settings
FOR SELECT
USING (auth.uid() = client_id);
