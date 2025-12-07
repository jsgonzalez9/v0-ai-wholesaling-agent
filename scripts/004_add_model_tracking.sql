-- Add model tracking columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS was_escalated BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN messages.model_used IS 'Which AI model was used: gpt-5-mini (Node A) or gpt-5 (Node B)';
COMMENT ON COLUMN messages.was_escalated IS 'Whether this message triggered escalation to Node B';
