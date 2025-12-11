-- Add opt-out fields to leads for compliance suppression
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS is_opted_out BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS optout_reason TEXT;

-- Index for quick suppression checks by phone
CREATE INDEX IF NOT EXISTS idx_leads_opted_out ON leads(is_opted_out);
