-- Run this in Supabase SQL Editor to create notification tracking tables

-- User activity tracking for notifications
CREATE TABLE IF NOT EXISTS user_activity (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  facts_viewed INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_email ON user_activity(email);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_active ON user_activity(last_active);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all on user_activity" ON user_activity FOR ALL USING (true) WITH CHECK (true);
