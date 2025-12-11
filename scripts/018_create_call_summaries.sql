CREATE TABLE IF NOT EXISTS call_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  transcript TEXT,
  summary TEXT,
  sentiment TEXT,
  intent TEXT,
  urgency INTEGER,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE call_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on call_summaries" ON call_summaries FOR ALL USING (true) WITH CHECK (true);
