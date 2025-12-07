-- Create agent configuration table for customizable settings
CREATE TABLE IF NOT EXISTS agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Your Company',
  wholesaling_fee DECIMAL(12, 2) DEFAULT 10000,
  arv_multiplier DECIMAL(4, 2) DEFAULT 0.70,
  follow_up_hours INTEGER DEFAULT 24,
  max_follow_ups INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_config ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations
CREATE POLICY "Allow all operations on agent_config" ON agent_config FOR ALL USING (true) WITH CHECK (true);

-- Insert default config
INSERT INTO agent_config (company_name, wholesaling_fee, arv_multiplier, follow_up_hours, max_follow_ups)
VALUES ('CashBuyer Properties', 10000, 0.70, 24, 3)
ON CONFLICT DO NOTHING;
