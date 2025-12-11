-- Create sms_events table to track SMS sends and statuses
CREATE TABLE IF NOT EXISTS sms_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sid TEXT,
  to_number TEXT NOT NULL,
  from_number TEXT,
  status TEXT, -- sent, delivered, failed, blocked
  error TEXT,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_events_sid ON sms_events(sid);
CREATE INDEX IF NOT EXISTS idx_sms_events_created ON sms_events(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_events_from ON sms_events(from_number);

ALTER TABLE sms_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on sms_events" ON sms_events FOR ALL USING (true) WITH CHECK (true);
