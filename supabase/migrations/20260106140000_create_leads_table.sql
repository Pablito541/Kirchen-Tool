-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'new',
  meta_form_id TEXT,
  meta_lead_id TEXT UNIQUE,
  platform TEXT DEFAULT 'manual'
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy for Agency (can view all)
CREATE POLICY "Agency can view all leads" ON leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agency'
    )
  );

-- Policy for Agency (can manage all leads)
CREATE POLICY "Agency can manage all leads" ON leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'agency'
    )
  );

-- Policy for Clients (can view leads for their campaigns)
CREATE POLICY "Clients can view leads for their campaigns" ON leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = leads.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );
