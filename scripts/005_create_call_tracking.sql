-- Create calls table to store voice call information
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('inbound', 'outbound')),
  call_status TEXT DEFAULT 'pending' CHECK (call_status IN ('pending', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer')),
  twilio_call_sid TEXT UNIQUE,
  duration_seconds INTEGER,
  transcript TEXT,
  summary TEXT,
  offer_discussed BOOLEAN DEFAULT FALSE,
  offer_amount DECIMAL(12, 2),
  next_steps TEXT,
  model_used TEXT DEFAULT 'gpt-5',
  sentiment TEXT, -- positive, neutral, negative
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for lead lookups
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(call_status);

-- Enable RLS
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on calls" ON calls FOR ALL USING (true) WITH CHECK (true);

-- Create call_events table for real-time WebSocket events
CREATE TABLE IF NOT EXISTS call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'connected', 'disconnected', 'transcript_update', 'tool_called', etc.
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_events_call_id ON call_events(call_id);

ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on call_events" ON call_events FOR ALL USING (true) WITH CHECK (true);
