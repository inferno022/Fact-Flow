import { supabase } from './supabaseClient';
import { Fact, UserProfile } from '../types';

// In-memory tracking of facts shown in current session (prevents duplicates even before DB sync)
const sessionSeenFacts = new Set<string>();
const sessionSeenContent = new Set<string>(); // Track content hash to catch duplicate content with different IDs
let dbSeenFactsLoaded = false;

// Load all seen facts from DB into session memory on startup
export const loadSeenFactsFromDB = async (userEmail: string): Promise<void> => {
  if (!userEmail || dbSeenFactsLoaded) return;
  
  try {
    const { data } = await supabase
      .from('user_seen_facts')
      .select('fact_id')
      .eq('user_email', userEmail);
    
    if (data) {
      data.forEach(row => sessionSeenFacts.add(row.fact_id));
      dbSeenFactsLoaded = true;
      console.log(`Loaded ${data.length} seen facts from DB for ${userEmail}`);
    }
  } catch (e) {
    console.error('Failed to load seen facts:', e);
  }
};

// Add fact to session tracking
export const trackFactInSession = (fact: Fact) => {
  sessionSeenFacts.add(fact.id);
  sessionSeenContent.add(hashContent(fact.content));
};

// Simple content hash for duplicate detection
const hashContent = (content: string): string => {
  return content.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
};

// Check if fact was already shown (in session or DB)
const isFactSeen = (factId: string, content: string, seenFactIds: string[]): boolean => {
  // Check session memory first (fastest) - includes DB facts loaded at startup
  if (sessionSeenFacts.has(factId)) return true;
  if (sessionSeenContent.has(hashContent(content))) return true;
  // Check DB records (backup)
  if (seenFactIds.includes(factId)) return true;
  return false;
};

// Load facts user hasn't seen yet - STRICT no duplicates
export const loadCachedFacts = async (topics: string[] = [], userEmail?: string): Promise<Fact[]> => {
  try {
    // Get ALL facts user has ever seen from DB (as backup to session memory)
    let seenFactIds: string[] = [];
    if (userEmail) {
      try {
        const { data: seenData } = await supabase
          .from('user_seen_facts')
          .select('fact_id')
          .eq('user_email', userEmail);
        seenFactIds = seenData?.map(s => s.fact_id) || [];
        // Also add to session memory
        seenFactIds.forEach(id => sessionSeenFacts.add(id));
      } catch {
        // Table might not exist yet
      }
    }

    // Fetch available facts from pool
    const { data, error } = await supabase
      .from('cached_facts')
      .select('id, topic, content, source_name, source_url, created_at')
      .order('created_at', { ascending: false })
      .limit(2000); // Get more to have better filtering pool

    if (error) throw error;

    if (data && data.length > 0) {
      // STRICT filtering - only facts user has NEVER seen
      const unseenFacts = data
        .filter(row => !isFactSeen(row.id, row.content, seenFactIds))
        .map(row => ({
          id: row.id,
          topic: row.topic,
          content: row.content,
          sourceName: row.source_name,
          sourceUrl: row.source_url,
          liked: false,
          saved: false,
          xpEarned: false
        }));

      console.log(`Found ${unseenFacts.length} unseen facts out of ${data.length} total`);

      // Shuffle for variety
      const shuffled = shuffleArray(unseenFacts);

      // Return only truly unseen facts (no fallback to seen facts)
      return shuffled.slice(0, 30);
    }
    return [];
  } catch (e) {
    console.error('Cache load error:', e);
    return [];
  }
};

// Fisher-Yates shuffle
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Mark fact as seen - this prevents it from showing again EVER
export const markFactSeen = async (factId: string, userEmail: string, content?: string): Promise<void> => {
  if (!factId) return;
  
  // Always track in session memory (instant, no DB delay)
  sessionSeenFacts.add(factId);
  if (content) {
    sessionSeenContent.add(hashContent(content));
  }
  
  // Also persist to DB for cross-session tracking
  if (!userEmail) return;
  try {
    await supabase.from('user_seen_facts').upsert({
      user_email: userEmail,
      fact_id: factId,
      seen_at: new Date().toISOString()
    }, { onConflict: 'user_email,fact_id' });
  } catch (e) {
    // Silent fail - session tracking still works
  }
};

// Like a fact
export const likeFact = async (factId: string, userEmail: string, liked: boolean): Promise<void> => {
  if (!userEmail) return;
  try {
    await supabase.from('user_seen_facts').upsert({
      user_email: userEmail,
      fact_id: factId,
      liked: liked,
      seen_at: new Date().toISOString()
    }, { onConflict: 'user_email,fact_id' });
  } catch (e) {
    console.error('Like error:', e);
  }
};

// Save new facts to global pool
export const saveFacts = async (facts: Fact[]): Promise<void> => {
  try {
    const rows = facts.filter(f => !f.isAd).map(f => ({
      id: f.id,
      topic: f.topic,
      content: f.content,
      source_name: f.sourceName,
      source_url: f.sourceUrl
    }));

    if (rows.length > 0) {
      await supabase.from('cached_facts').upsert(rows, { onConflict: 'id' });
    }
  } catch (e) {
    console.error('Cache save error:', e);
  }
};

// Get count of facts in pool by topic
export const getFactPoolStats = async (): Promise<Record<string, number>> => {
  try {
    const { data } = await supabase
      .from('cached_facts')
      .select('topic');
    
    if (!data) return {};
    
    const stats: Record<string, number> = {};
    data.forEach(row => {
      stats[row.topic] = (stats[row.topic] || 0) + 1;
    });
    return stats;
  } catch {
    return {};
  }
};

// Save user profile
export const saveUserProfile = async (user: UserProfile): Promise<void> => {
  if (!user.email) return;
  
  try {
    await supabase.from('users').upsert({
      email: user.email,
      username: user.username,
      level: user.level,
      xp: user.xp,
      streak: user.streak,
      interests: user.interests,
      topic_weights: user.topicWeights,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });
  } catch (e) {
    console.error('User save error:', e);
  }
};

// Load user profile
export const loadUserProfile = async (email: string): Promise<Partial<UserProfile> | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return null;

    return {
      username: data.username,
      level: data.level,
      xp: data.xp,
      streak: data.streak,
      interests: data.interests || [],
      topicWeights: data.topic_weights || {}
    };
  } catch (e) {
    return null;
  }
};

// Create shareable link
export const createShareLink = async (fact: Fact, username: string): Promise<string> => {
  const shareId = Math.random().toString(36).substring(2, 10);
  
  try {
    await supabase.from('shared_facts').insert({
      share_id: shareId,
      fact_id: fact.id,
      topic: fact.topic,
      content: fact.content,
      source_name: fact.sourceName,
      source_url: fact.sourceUrl,
      shared_by: username
    });
  } catch (e) {
    console.error('Share link error:', e);
  }
  
  return `https://factflow.app/f/${shareId}`;
};

// Get shared fact
export const getSharedFact = async (shareId: string): Promise<Fact | null> => {
  try {
    const { data, error } = await supabase
      .from('shared_facts')
      .select('*')
      .eq('share_id', shareId)
      .single();

    if (error || !data) return null;

    return {
      id: data.fact_id,
      topic: data.topic,
      content: data.content,
      sourceName: data.source_name,
      sourceUrl: data.source_url,
      liked: false,
      saved: false,
      xpEarned: false
    };
  } catch (e) {
    return null;
  }
};
