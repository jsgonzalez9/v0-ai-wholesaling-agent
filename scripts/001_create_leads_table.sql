-- Create leads table to store property owner information
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  notes TEXT,
  property_condition TEXT,
  motivation TEXT,
  timeline TEXT,
  price_expectation DECIMAL(12, 2),
  arv DECIMAL(12, 2),
  repair_estimate DECIMAL(12, 2),
  offer_amount DECIMAL(12, 2),
  conversation_state TEXT DEFAULT 'cold_lead' CHECK (conversation_state IN ('cold_lead', 'contacted', 'qualified', 'offer_made', 'offer_accepted', 'contract_sent', 'contract_signed', 'closed', 'lost')),
  contract_link TEXT,
  last_message_at TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,
  pipeline_status TEXT DEFAULT 'NEW' CHECK (pipeline_status IN ('NEW','WARM','HOT','DEAD','FOLLOW-UP')),
  tags TEXT[],
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for phone number lookups (used by Twilio webhooks)
CREATE INDEX IF NOT EXISTS idx_leads_phone_number ON leads(phone_number);

-- Create index for conversation state filtering
CREATE INDEX IF NOT EXISTS idx_leads_conversation_state ON leads(conversation_state);

-- Enable RLS but allow all operations (no auth required for this MVP)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust for production with proper auth)
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true) WITH CHECK (true);
