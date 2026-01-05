-- Run this in Supabase SQL Editor to add social features
-- Go to: https://supabase.com/dashboard/project/libcgvamzfkuhfexxfgz/sql/new

-- Add likes count and view count to cached_facts
ALTER TABLE cached_facts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE cached_facts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Track which facts users have seen
CREATE TABLE IF NOT EXISTS user_seen_facts (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  fact_id TEXT NOT NULL,
  seen_at TIMESTAMPTZ DEFAULT NOW(),
  liked BOOLEAN DEFAULT FALSE,
  UNIQUE(user_email, fact_id)
);

ALTER TABLE user_seen_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access user_seen_facts" ON user_seen_facts FOR ALL USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_seen_email ON user_seen_facts(user_email);
CREATE INDEX IF NOT EXISTS idx_cached_facts_likes ON cached_facts(likes DESC);
CREATE INDEX IF NOT EXISTS idx_cached_facts_views ON cached_facts(views);
