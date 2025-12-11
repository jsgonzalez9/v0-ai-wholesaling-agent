ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS consent_status TEXT CHECK (consent_status IN ('opt_in','opt_out','unknown')) DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_source TEXT;
