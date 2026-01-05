-- Run this in Supabase SQL Editor to add shared facts table
-- Go to: https://supabase.com/dashboard/project/libcgvamzfkuhfexxfgz/sql/new

CREATE TABLE IF NOT EXISTS shared_facts (
  share_id TEXT PRIMARY KEY,
  fact_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  shared_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shared_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read shared_facts" ON shared_facts FOR SELECT USING (true);
CREATE POLICY "Allow public insert shared_facts" ON shared_facts FOR INSERT WITH CHECK (true);
