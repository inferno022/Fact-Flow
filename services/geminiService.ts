import { GoogleGenAI, Type } from "@google/genai";
import { Fact } from "../types";
import { loadCachedFacts, saveFacts, getFactPoolStats } from "./cacheService";
import { ALL_TOPICS } from "../constants";

// Get API key from environment - try multiple sources
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
               (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
               '';

if (!apiKey) {
  console.warn('⚠️ API key not found. Make sure .env.local has VITE_GEMINI_API_KEY and restart the dev server.');
}

let ai: GoogleGenAI | null = null;
try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
} catch (e) {
  console.error('Failed to initialize GoogleGenAI:', e);
}

let isBackgroundFetching = false;

// Enhanced fallback facts - truly obscure and mind-blowing
const FALLBACK_FACTS: Fact[] = [
  { id: 'fb1', topic: 'Space', content: 'Neutron stars are so dense that a teaspoon would weigh 6 billion tons on Earth.', sourceName: 'NASA', sourceUrl: 'https://nasa.gov', liked: false, saved: false, xpEarned: false },
  { id: 'fb2', topic: 'Science', content: 'There are more possible iterations of a game of chess than atoms in the observable universe.', sourceName: 'Nature', sourceUrl: 'https://nature.com', liked: false, saved: false, xpEarned: false },
  { id: 'fb3', topic: 'Animals', content: 'A mantis shrimp can punch with the force of a bullet and see 16 types of color receptors (humans have 3).', sourceName: 'Smithsonian', sourceUrl: 'https://si.edu', liked: false, saved: false, xpEarned: false },
  { id: 'fb4', topic: 'History', content: 'Oxford University is older than the Aztec Empire. Teaching began in Oxford in 1096.', sourceName: 'Oxford', sourceUrl: 'https://ox.ac.uk', liked: false, saved: false, xpEarned: false },
  { id: 'fb5', topic: 'Human Body', content: 'Your body produces 25 million new cells each second. You produce more cells than there are people in the US every 13 seconds.', sourceName: 'NIH', sourceUrl: 'https://nih.gov', liked: false, saved: false, xpEarned: false },
  { id: 'fb6', topic: 'Technology', content: 'The entire Apollo 11 computer had less processing power than a modern calculator.', sourceName: 'IEEE', sourceUrl: 'https://ieee.org', liked: false, saved: false, xpEarned: false },
  { id: 'fb7', topic: 'Nature', content: 'A single bolt of lightning contains enough energy to toast 100,000 slices of bread.', sourceName: 'NOAA', sourceUrl: 'https://noaa.gov', liked: false, saved: false, xpEarned: false },
  { id: 'fb8', topic: 'Psychology', content: 'The brain named itself. It is the only organ that has named itself.', sourceName: 'Scientific American', sourceUrl: 'https://scientificamerican.com', liked: false, saved: false, xpEarned: false },
  { id: 'fb9', topic: 'Food', content: 'Honey found in Egyptian tombs over 3,000 years old was still perfectly edible.', sourceName: 'Smithsonian', sourceUrl: 'https://si.edu', liked: false, saved: false, xpEarned: false },
  { id: 'fb10', topic: 'Geography', content: 'There is a town in Norway called Hell, and it freezes over every winter.', sourceName: 'Atlas Obscura', sourceUrl: 'https://atlasobscura.com', liked: false, saved: false, xpEarned: false },
  { id: 'fb11', topic: 'Music', content: 'The longest concert ever lasted 639 years. It started in 2001 and will end in 2640.', sourceName: 'BBC', sourceUrl: 'https://bbc.com', liked: false, saved: false, xpEarned: false },
  { id: 'fb12', topic: 'Art', content: 'The Eiffel Tower can grow up to 6 inches taller in summer due to thermal expansion.', sourceName: 'Tour Eiffel', sourceUrl: 'https://toureiffel.paris', liked: false, saved: false, xpEarned: false },
  { id: 'fb13', topic: 'Sports', content: 'A baseball has exactly 108 stitches. The first and last stitches are hidden.', sourceName: 'MLB', sourceUrl: 'https://mlb.com', liked: false, saved: false, xpEarned: false },
  { id: 'fb14', topic: 'Business', content: 'Nintendo was founded in 1889 as a playing card company, 80 years before video games existed.', sourceName: 'Nintendo', sourceUrl: 'https://nintendo.com', liked: false, saved: false, xpEarned: false },
  { id: 'fb15', topic: 'Mythology', content: 'In ancient Greece, throwing an apple at someone was considered a declaration of love.', sourceName: 'Britannica', sourceUrl: 'https://britannica.com', liked: false, saved: false, xpEarned: false },
];

// Shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get shuffled fallbacks with unique IDs
const getShuffledFallbacks = (): Fact[] => {
  return shuffleArray(FALLBACK_FACTS).map(f => ({ 
    ...f, 
    id: `fb-${Math.random().toString(36).substring(2, 11)}` 
  }));
};

// Main function to get facts for user
export const getFacts = async (weightedTopics: string[], dislikes: string[] = [], randomOnly: boolean = false, userEmail?: string): Promise<Fact[]> => {
  
  // Try to load from cache first (facts user hasn't seen)
  const cachedFacts = await loadCachedFacts(weightedTopics, userEmail);
  
  // Start background generation to keep pool fresh
  if (!isBackgroundFetching) {
    isBackgroundFetching = true;
    generateFactsForPool(weightedTopics).finally(() => {
      isBackgroundFetching = false;
    });
  }
  
  // If we have cached facts, return them
  if (cachedFacts.length >= 5) {
    return cachedFacts;
  }
  
  // Not enough cached facts - generate new ones
  const newFacts = await fetchFromAI(weightedTopics, dislikes, randomOnly);
  if (newFacts.length > 0) {
    // Save to pool for other users too
    saveFacts(newFacts);
    return [...cachedFacts, ...newFacts].slice(0, 30);
  }
  
  // Fallback if everything fails
  return cachedFacts.length > 0 ? cachedFacts : getShuffledFallbacks();
};

// Generate facts and add to global pool
const generateFactsForPool = async (userTopics: string[] = []) => {
  try {
    // Check which topics need more facts
    const stats = await getFactPoolStats();
    
    // Find topics with fewer facts
    const topicsNeedingFacts = ALL_TOPICS.filter(topic => {
      const count = stats[topic] || 0;
      return count < 100; // Target 100+ facts per topic
    });
    
    if (topicsNeedingFacts.length === 0) return;
    
    // Pick random topics to generate for (prioritize user's topics)
    const priorityTopics = topicsNeedingFacts.filter(t => userTopics.includes(t));
    const otherTopics = topicsNeedingFacts.filter(t => !userTopics.includes(t));
    
    const topicsToGenerate = [
      ...shuffleArray(priorityTopics).slice(0, 2),
      ...shuffleArray(otherTopics).slice(0, 1)
    ];
    
    // Generate facts for each topic
    for (const topic of topicsToGenerate) {
      await generateFactsForTopic(topic);
    }
  } catch (e) {
    console.error('Pool generation error:', e);
  }
};

// Fetch facts from AI
const fetchFromAI = async (weightedTopics: string[], dislikes: string[], randomOnly: boolean): Promise<Fact[]> => {
  // Enhanced subtopics for more obscure facts
  const subtopicPrompts: Record<string, string[]> = {
    "Science": ["quantum entanglement paradoxes", "bizarre chemical reactions", "extremophile organisms", "CRISPR breakthroughs", "dark matter mysteries", "particle physics anomalies", "bioluminescence", "superconductors"],
    "Space": ["rogue planets", "magnetars", "space archaeology", "exoplanet atmospheres", "cosmic voids", "gravitational waves", "interstellar objects", "pulsar timing"],
    "History": ["lost civilizations", "historical coincidences", "forgotten inventions", "ancient technology", "mysterious disappearances", "unsung heroes", "bizarre laws", "secret societies"],
    "Technology": ["quantum computing breakthroughs", "abandoned tech projects", "accidental inventions", "tech that predicted the future", "failed predictions", "hidden features", "prototype disasters"],
    "Nature": ["deep sea discoveries", "extreme weather records", "bioluminescent phenomena", "geological oddities", "symbiotic relationships", "plant intelligence", "natural phenomena"],
    "Animals": ["animal superpowers", "bizarre mating rituals", "extreme survival", "animal intelligence tests", "cryptic species", "parasitic behaviors", "collective intelligence"],
    "Human Body": ["vestigial features", "genetic anomalies", "microbiome discoveries", "sensory illusions", "regeneration abilities", "circadian mysteries", "placebo effects"],
    "Psychology": ["cognitive illusions", "mass hysteria events", "memory manipulation", "decision paradoxes", "synesthesia", "psychological experiments", "unconscious behaviors"],
    "Art": ["art heists", "hidden messages in paintings", "controversial artworks", "art forgeries", "lost masterpieces", "accidental art", "art world scandals"],
    "Music": ["musical savants", "sound frequencies effects", "lost recordings", "instrument origins", "music and brain", "banned songs", "acoustic phenomena"],
    "Sports": ["sports science breakthroughs", "bizarre sports rules", "athletic anomalies", "sports superstitions", "record controversies", "forgotten sports"],
    "Food": ["food science experiments", "culinary accidents", "forbidden foods", "food preservation secrets", "taste perception", "molecular gastronomy", "food origins"],
    "Geography": ["border anomalies", "micronations", "geographic oddities", "disputed territories", "extreme locations", "hidden places", "cartographic errors"],
    "Business": ["business failures that succeeded", "accidental billionaires", "corporate secrets", "market anomalies", "business rivalries", "startup pivots"],
    "Mythology": ["cross-cultural myths", "mythological creatures origins", "prophecies that came true", "forgotten deities", "ritual origins", "legendary artifacts"]
  };

  // Build diverse topic list
  const topicsToUse = weightedTopics.length > 0 ? weightedTopics : ALL_TOPICS;
  const selectedSubtopics: string[] = [];
  
  topicsToUse.forEach(topic => {
    const subs = subtopicPrompts[topic] || [topic];
    selectedSubtopics.push(...shuffleArray(subs).slice(0, 2));
  });

  const topicContext = shuffleArray(selectedSubtopics).slice(0, 8).join(", ");

  if (!ai) {
    console.error('AI client not initialized - missing API key');
    return [];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a curator of the world's most obscure, mind-blowing facts. Generate 10 TRULY RARE facts that 99% of people have never heard.

Topics to explore: ${topicContext}

STRICT REQUIREMENTS:
- Facts must be VERIFIED and from reputable sources
- NO common "fun facts" that appear on typical lists
- Each fact should make someone say "Wait, WHAT?!"
- Include specific numbers, dates, names, or measurements
- Facts should be counterintuitive or challenge assumptions
- Maximum 120 characters per fact
- Each fact from a DIFFERENT subtopic
- Prioritize recent discoveries (2020+) when possible
- Include at least 2 facts most fact-checkers would need to verify

AVOID these overused facts:
- Honey never spoils
- Octopus hearts
- Venus day length
- Cleopatra/pyramids timeline
- Bananas are berries

Return as JSON array: [{topic, content, sourceName, sourceUrl}]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              content: { type: Type.STRING },
              sourceName: { type: Type.STRING },
              sourceUrl: { type: Type.STRING }
            },
            required: ["topic", "content", "sourceName", "sourceUrl"]
          }
        }
      }
    });

    const rawFacts = JSON.parse(response.text || "[]");
    return rawFacts.map((f: any) => ({
      ...f,
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      liked: false,
      saved: false,
      xpEarned: false
    }));
  } catch (e) {
    console.error('AI fetch error:', e);
    return [];
  }
};

// Generate many facts for a specific topic (for pool building)
export const generateFactsForTopic = async (topic: string): Promise<void> => {
  const subtopics = {
    "Science": ["quantum mechanics", "chemistry reactions", "cell biology", "DNA discoveries", "physics laws", "scientific experiments"],
    "Space": ["black holes", "Mars exploration", "distant galaxies", "astronaut stories", "space technology", "cosmic events"],
    "History": ["ancient Egypt", "Roman Empire", "World War facts", "medieval life", "famous battles", "historical figures"],
    "Technology": ["AI breakthroughs", "internet origins", "smartphone evolution", "computer history", "future predictions"],
    "Nature": ["deep ocean", "rainforest secrets", "volcanic activity", "weather extremes", "ecosystem wonders"],
    "Animals": ["deep sea creatures", "insect superpowers", "mammal intelligence", "bird migrations", "animal records"],
    "Human Body": ["brain mysteries", "heart facts", "immune system", "sleep science", "human limits"],
    "Psychology": ["memory tricks", "emotional science", "dream research", "habit formation", "perception illusions"],
    "Art": ["famous artworks", "art heists", "artist lives", "art techniques", "hidden meanings"],
    "Music": ["music history", "instrument origins", "famous composers", "song stories", "music science"],
    "Sports": ["Olympic records", "sports origins", "athlete feats", "unusual sports", "sports science"],
    "Food": ["food origins", "cooking chemistry", "cuisine history", "ingredient secrets", "food records"],
    "Geography": ["country facts", "natural wonders", "border oddities", "city secrets", "map mysteries"],
    "Business": ["company origins", "billionaire stories", "market crashes", "invention patents", "business failures"],
    "Mythology": ["Greek gods", "Norse legends", "creation myths", "mythical beasts", "folklore origins"]
  };

  const subs = subtopics[topic as keyof typeof subtopics] || [topic];
  const randomSub = subs[Math.floor(Math.random() * subs.length)];

  if (!ai) {
    console.error('AI client not initialized - missing API key');
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate 15 unique, obscure facts about "${randomSub}" (category: ${topic}).

Requirements:
- Facts most people have NEVER heard
- Specific numbers, dates, names when possible
- Surprising, counterintuitive, or mind-blowing
- Max 100 characters each
- Viral-worthy content
- NO commonly known facts

Return JSON array: [{topic: "${topic}", content, sourceName, sourceUrl}]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              content: { type: Type.STRING },
              sourceName: { type: Type.STRING },
              sourceUrl: { type: Type.STRING }
            },
            required: ["topic", "content", "sourceName", "sourceUrl"]
          }
        }
      }
    });

    const rawFacts = JSON.parse(response.text || "[]");
    const facts = rawFacts.map((f: any) => ({
      ...f,
      topic: topic, // Ensure consistent topic name
      id: `pool-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      liked: false,
      saved: false,
      xpEarned: false
    }));
    
    if (facts.length > 0) {
      await saveFacts(facts);
    }
  } catch (e) {
    console.error('Topic generation error:', e);
  }
};
