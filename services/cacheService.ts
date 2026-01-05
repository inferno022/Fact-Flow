import { supabase } from './supabaseClient';
import { Fact, UserProfile } from '../types';

// ULTRA-STRONG duplicate prevention - NEVER show same fact twice EVER
const sessionSeenFacts = new Set<string>();
const sessionSeenContent = new Set<string>(); 
const sessionSeenHashes = new Set<string>(); 
const sessionSeenKeywords = new Set<string>(); // Track key phrases
const sessionSeenNumbers = new Set<string>(); // Track specific numbers/dates
let dbSeenFactsLoaded = false;

// ULTRA-ENHANCED content similarity detection - catches even paraphrased facts
const createContentHash = (content: string): string => {
  // Remove punctuation, normalize spaces, lowercase
  const normalized = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extract key elements that make facts unique
  const words = normalized.split(' ').filter(w => w.length > 3);
  const sortedWords = [...words].sort().join(' ');
  const firstHalf = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const lastHalf = words.slice(Math.ceil(words.length / 2)).join(' ');
  
  // Extract numbers, dates, and proper nouns (likely to be unique identifiers)
  const numbers = content.match(/\d+/g) || [];
  const properNouns = content.match(/[A-Z][a-z]+/g) || [];
  
  // Create multiple hash variants for maximum duplicate detection
  return `${normalized.substring(0, 60)}|${sortedWords.substring(0, 60)}|${firstHalf}|${lastHalf}|${numbers.join(',')}|${properNouns.join(',')}`;
};

// Extract key phrases that make a fact unique
const extractKeyPhrases = (content: string): string[] => {
  const phrases: string[] = [];
  
  // Extract numbers with context (e.g., "25 million", "1947", "3.14")
  const numberMatches = content.match(/\d+[\d,.]*(?: (?:million|billion|trillion|thousand|years?|days?|hours?|minutes?|seconds?|percent|%|degrees?|miles?|kilometers?|feet|meters|inches|pounds|kilograms|tons?))?/gi) || [];
  phrases.push(...numberMatches);
  
  // Extract proper nouns (names, places, organizations)
  const properNouns = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  phrases.push(...properNouns);
  
  // Extract scientific terms and unique phrases
  const scientificTerms = content.match(/\b(?:DNA|RNA|quantum|neutron|electron|molecule|atom|protein|enzyme|bacteria|virus|galaxy|planet|species|genus)\b/gi) || [];
  phrases.push(...scientificTerms);
  
  return phrases.map(p => p.toLowerCase().trim()).filter(p => p.length > 2);
};

// Load all seen facts from DB into session memory on startup
export const loadSeenFactsFromDB = async (userEmail: string): Promise<void> => {
  if (!userEmail || dbSeenFactsLoaded) return;
  
  try {
    const { data } = await supabase
      .from('user_seen_facts')
      .select('fact_id, content_hash')
      .eq('user_email', userEmail);
    
    if (data) {
      data.forEach(row => {
        sessionSeenFacts.add(row.fact_id);
        if (row.content_hash) {
          sessionSeenHashes.add(row.content_hash);
          
          // Extract and track key phrases from stored hashes
          const hashParts = row.content_hash.split('|');
          if (hashParts.length >= 6) {
            // Extract numbers and proper nouns from hash
            const numbers = hashParts[4] ? hashParts[4].split(',') : [];
            const properNouns = hashParts[5] ? hashParts[5].split(',') : [];
            
            numbers.forEach(num => num && sessionSeenNumbers.add(num));
            properNouns.forEach(noun => noun && sessionSeenKeywords.add(noun.toLowerCase()));
          }
        }
      });
      dbSeenFactsLoaded = true;
      console.log(`Loaded ${data.length} seen facts with enhanced tracking for ${userEmail}`);
    }
  } catch (e) {
    console.error('Failed to load seen facts:', e);
  }
};

// Add fact to session tracking with ULTRA-ENHANCED similarity detection
export const trackFactInSession = (fact: Fact) => {
  sessionSeenFacts.add(fact.id);
  
  const contentHash = createContentHash(fact.content);
  sessionSeenContent.add(contentHash);
  sessionSeenHashes.add(contentHash);
  
  // Track key phrases that make this fact unique
  const keyPhrases = extractKeyPhrases(fact.content);
  keyPhrases.forEach(phrase => sessionSeenKeywords.add(phrase));
  
  // Track numbers/dates for ultra-precise duplicate detection
  const numbers = fact.content.match(/\d+/g) || [];
  numbers.forEach(num => sessionSeenNumbers.add(num));
};

// Simple content hash for duplicate detection (legacy)
const hashContent = (content: string): string => {
  return content.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
};

// ULTRA-ENHANCED fact similarity detection - catches everything
const isFactSeen = (factId: string, content: string, seenFactIds: string[]): boolean => {
  // 1. Check session memory first (fastest) - includes DB facts loaded at startup
  if (sessionSeenFacts.has(factId)) return true;
  
  // 2. Check enhanced content similarity
  const contentHash = createContentHash(content);
  if (sessionSeenHashes.has(contentHash)) return true;
  
  // 3. Check legacy content hash
  if (sessionSeenContent.has(hashContent(content))) return true;
  
  // 4. Check DB records (backup)
  if (seenFactIds.includes(factId)) return true;
  
  // 5. ULTRA-PRECISE: Check key phrases overlap
  const keyPhrases = extractKeyPhrases(content);
  for (const phrase of keyPhrases) {
    if (sessionSeenKeywords.has(phrase)) {
      console.log(`Blocked duplicate fact due to key phrase: "${phrase}"`);
      return true; // Same key phrase = likely duplicate
    }
  }
  
  // 6. Check number/date overlap (very specific facts often share unique numbers)
  const numbers = content.match(/\d+/g) || [];
  for (const num of numbers) {
    if (sessionSeenNumbers.has(num) && num.length >= 3) { // Only check significant numbers
      // Additional context check - if number appears with similar context, it's likely duplicate
      const numContext = content.toLowerCase().substring(
        Math.max(0, content.toLowerCase().indexOf(num) - 20),
        content.toLowerCase().indexOf(num) + num.length + 20
      );
      
      // Check if this number context is too similar to seen facts
      for (const seenHash of sessionSeenHashes) {
        if (seenHash.includes(num) && seenHash.includes(numContext.substring(0, 10))) {
          console.log(`Blocked duplicate fact due to number context: "${num}" in "${numContext}"`);
          return true;
        }
      }
    }
  }
  
  // 7. Semantic similarity check - if content is very similar to any seen fact
  const normalizedContent = content.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
  for (const seenHash of sessionSeenHashes) {
    const [seenNormalized] = seenHash.split('|');
    if (seenNormalized && normalizedContent.length > 30 && seenNormalized.length > 30) {
      // Calculate similarity ratio
      const similarity = calculateSimilarity(normalizedContent, seenNormalized);
      if (similarity > 0.7) { // 70% similarity threshold
        console.log(`Blocked duplicate fact due to high similarity: ${similarity.toFixed(2)}`);
        return true;
      }
    }
  }
  
  return false;
};

// Calculate text similarity ratio
const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.split(' ').filter(w => w.length > 3));
  const words2 = new Set(text2.split(' ').filter(w => w.length > 3));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
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
    const contentHash = createContentHash(content);
    sessionSeenContent.add(hashContent(content)); // Legacy
    sessionSeenHashes.add(contentHash); // Enhanced
  }
  
  // Also persist to DB for cross-session tracking
  if (!userEmail) return;
  try {
    const contentHash = content ? createContentHash(content) : null;
    await supabase.from('user_seen_facts').upsert({
      user_email: userEmail,
      fact_id: factId,
      content_hash: contentHash,
      seen_at: new Date().toISOString()
    }, { onConflict: 'user_email,fact_id' });
  } catch (e) {
    // Silent fail - session tracking still works
    console.error('Failed to mark fact as seen in DB:', e);
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
