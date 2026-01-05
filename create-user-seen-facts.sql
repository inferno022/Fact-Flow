-- Run this in Supabase SQL Editor to create the user_seen_facts table

CREATE TABLE IF NOT EXISTS user_seen_facts (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  fact_id TEXT NOT NULL,
  liked BOOLEAN DEFAULT FALSE,
  seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, fact_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_seen_facts_email ON user_seen_facts(user_email);
CREATE INDEX IF NOT EXISTS idx_user_seen_facts_fact ON user_seen_facts(fact_id);

-- Enable RLS
ALTER TABLE user_seen_facts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all operations on user_seen_facts" ON user_seen_facts
  FOR ALL USING (true) WITH CHECK (true);
