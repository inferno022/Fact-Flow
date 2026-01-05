-- Reset all seen facts for fresh start with ultra-strong duplicate prevention
-- Run this ONCE when deploying the Groq update

-- Clear all user seen facts (gives everyone a fresh start)
DELETE FROM user_seen_facts;

-- Clear the cached facts pool to force regeneration with Groq
DELETE FROM cached_facts;

-- Reset any user progress if you want completely fresh start (optional)
-- UPDATE users SET level = 1, xp = 0, streak = 0 WHERE level > 1;

-- Verify tables are cleared
SELECT 'user_seen_facts' as table_name, COUNT(*) as remaining_records FROM user_seen_facts
UNION ALL
SELECT 'cached_facts' as table_name, COUNT(*) as remaining_records FROM cached_facts;

-- This ensures:
-- 1. No user will see any previously seen facts
-- 2. All facts will be regenerated using Groq API
-- 3. Ultra-strong duplicate prevention starts with clean slate
-- 4. Users get completely fresh, unique facts