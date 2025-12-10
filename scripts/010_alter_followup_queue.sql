-- Add queue fields to follow_up_sequences for retry/backoff
ALTER TABLE follow_up_sequences
  ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_last TEXT;

CREATE INDEX IF NOT EXISTS idx_followup_attempts ON follow_up_sequences(attempts);
CREATE INDEX IF NOT EXISTS idx_followup_next_attempt ON follow_up_sequences(next_attempt_at);
