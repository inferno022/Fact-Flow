-- Run this SQL in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/libcgvamzfkuhfexxfgz/sql/new

-- Cached Facts Table
CREATE TABLE IF NOT EXISTS cached_facts (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  username TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  interests TEXT[] DEFAULT '{}',
  topic_weights JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cached_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for cached_facts (facts are public)
CREATE POLICY "Allow public read cached_facts" ON cached_facts FOR SELECT USING (true);
CREATE POLICY "Allow public insert cached_facts" ON cached_facts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update cached_facts" ON cached_facts FOR UPDATE USING (true);

-- Allow users to read/write their own data
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_cached_facts_created ON cached_facts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cached_facts_topic ON cached_facts(topic);
