ALTER TABLE agent_config
  ADD COLUMN IF NOT EXISTS followup_backoff_minutes INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS followup_max_attempts INTEGER DEFAULT 3;
