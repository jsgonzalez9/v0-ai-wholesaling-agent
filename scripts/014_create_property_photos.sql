CREATE TABLE IF NOT EXISTS property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on property_photos" ON property_photos FOR ALL USING (true) WITH CHECK (true);
