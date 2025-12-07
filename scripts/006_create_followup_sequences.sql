-- Create follow-up sequences table to track message progression
CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL DEFAULT 0 CHECK (sequence_number >= 0 AND sequence_number <= 12),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'completed')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  next_sequence_scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient follow-up scheduling queries
CREATE INDEX IF NOT EXISTS idx_followup_sequences_scheduled ON follow_up_sequences(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_followup_sequences_lead ON follow_up_sequences(lead_id);

-- Enable RLS
ALTER TABLE follow_up_sequences ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations
CREATE POLICY "Allow all operations on follow_up_sequences" ON follow_up_sequences FOR ALL USING (true) WITH CHECK (true);
