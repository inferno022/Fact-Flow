-- Add content_hash column to user_seen_facts table for better duplicate detection
-- This helps prevent showing similar facts to users

ALTER TABLE user_seen_facts 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create index for faster content hash lookups
CREATE INDEX IF NOT EXISTS idx_user_seen_facts_content_hash 
ON user_seen_facts(content_hash);

-- Create composite index for user + content hash lookups
CREATE INDEX IF NOT EXISTS idx_user_seen_facts_user_content 
ON user_seen_facts(user_email, content_hash);

-- Update existing records to have content hashes (optional, for existing data)
-- This would need to be run manually if you have existing data
-- UPDATE user_seen_facts SET content_hash = LEFT(LOWER(REGEXP_REPLACE(fact_id, '[^a-z0-9]', '', 'g')), 50) WHERE content_hash IS NULL;