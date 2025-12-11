CREATE TABLE IF NOT EXISTS conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  sentiment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on conversation_summaries" ON conversation_summaries FOR ALL USING (true) WITH CHECK (true);
