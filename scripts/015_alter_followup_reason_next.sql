ALTER TABLE follow_up_sequences
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS next_action TEXT;
