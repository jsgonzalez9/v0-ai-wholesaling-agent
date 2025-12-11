CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sms','voicemail')),
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  recording_url TEXT,
  active BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON sequence_steps(sequence_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_sequence_step ON sequence_steps(sequence_id, step_index);

CREATE TABLE IF NOT EXISTS lead_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  current_step_index INTEGER DEFAULT 0,
  next_run_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_sequences_next ON lead_sequences(next_run_at, completed);
CREATE INDEX IF NOT EXISTS idx_lead_sequences_lead ON lead_sequences(lead_id);

CREATE TABLE IF NOT EXISTS lead_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_sequence_id UUID NOT NULL REFERENCES lead_sequences(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  metadata JSONB
);
CREATE INDEX IF NOT EXISTS idx_lead_sequence_steps_seq ON lead_sequence_steps(lead_sequence_id);

ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on sequences" ON sequences FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on sequence_steps" ON sequence_steps FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE lead_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on lead_sequences" ON lead_sequences FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE lead_sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on lead_sequence_steps" ON lead_sequence_steps FOR ALL USING (true) WITH CHECK (true);
