CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('opt_in','opt_out')),
  source TEXT, -- keyword, web, call
  message_sid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_phone ON consents(phone_number);
CREATE INDEX IF NOT EXISTS idx_consents_event ON consents(event);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on consents" ON consents FOR ALL USING (true) WITH CHECK (true);
