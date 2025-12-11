-- A2P 10DLC tables for brand/campaign registration and logs
CREATE TABLE IF NOT EXISTS a2p_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  ein TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  use_case TEXT NOT NULL,
  submission_status TEXT DEFAULT 'draft', -- draft, submitted, approved, rejected
  provider_id TEXT, -- external provider ref (Twilio/TCR)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS a2p_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES a2p_brands(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  description TEXT,
  message_flow TEXT,
  call_to_action TEXT,
  sample_messages TEXT,
  submission_status TEXT DEFAULT 'draft', -- draft, submitted, approved, rejected
  provider_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS a2p_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- brand|campaign|sms
  entity_id UUID,
  level TEXT NOT NULL DEFAULT 'info', -- info|warn|error
  message TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE a2p_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2p_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2p_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on a2p" ON a2p_brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on a2p" ON a2p_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on a2p" ON a2p_logs FOR ALL USING (true) WITH CHECK (true);
