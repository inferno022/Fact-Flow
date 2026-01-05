import { Fact } from "../types";
import { loadCachedFacts, saveFacts, getFactPoolStats } from "./cacheService";
import { ALL_TOPICS } from "../constants";

// Groq API configuration
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

if (!GROQ_API_KEY) {
  console.error('⚠️ Groq API key not found!');
}

let isBackgroundFetching = false;

// Ultra-unique fallback facts - extremely obscure
const FALLBACK_FACTS: Fact[] = [
  { id: 'gf1', topic: 'Space', content: 'The footprints on the Moon will last for millions of years because there is no wind to blow them away.', sourceName: 'NASA', sourceUrl: 'https://nasa.gov', liked: false, saved: false, xpEarned: false },
  { id: 'gf2', topic: 'Science', content: 'A single raindrop contains more molecules than there are raindrops in all the clouds on Earth.', sourceName: 'Nature', sourceUrl: 'https://nature.com', liked: false, saved: false, xpEarned: false },
  { id: 'gf3', topic: 'Animals', content: 'Tardigrades can survive in the vacuum of space for 10 days and still reproduce afterward.', sourceName: 'Smithsonian', sourceUrl: 'https://si.edu', liked: false, saved: false, xpEarned: false },
  { id: 'gf4', topic: 'History', content: 'The Great Wall of China is not visible from space with the naked eye, despite popular belief.', sourceName: 'ESA', sourceUrl: 'https://esa.int', liked: false, saved: false, xpEarned: false },
  { id: 'gf5', topic: 'Human Body', content: 'Your stomach gets an entirely new lining every 3-5 days because stomach acid would digest it.', sourceName: 'NIH', sourceUrl: 'https://nih.gov', liked: false, saved: false, xpEarned: false },
  { id: 'gf6', topic: 'Technology', content: 'The first computer bug was an actual bug - a moth trapped in a Harvard computer in 1947.', sourceName: 'IEEE', sourceUrl: 'https://ieee.org', liked: false, saved: false, xpEarned: false },
  { id: 'gf7', topic: 'Nature', content: 'Trees can communicate with each other through underground fungal networks called mycorrhizae.', sourceName: 'Science', sourceUrl: 'https://science.org', liked: false, saved: false, xpEarned: false },
  { id: 'gf8', topic: 'Psychology', content: 'The smell of rain has a name: petrichor, from Greek words meaning "stone" and "the fluid of the gods".', sourceName: 'Nature', sourceUrl: 'https://nature.com', liked: false, saved: false, xpEarned: false },
];

// Shuffle array utility
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
    id: `gf-${Math.random().toString(36).substring(2, 11)}` 
  }));
};

// Call Groq API
const callGroqAPI = async (prompt: string): Promise<any> => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and high-quality model
        messages: [
          {
            role: 'system',
            content: 'You are an expert fact curator specializing in ultra-rare, mind-blowing facts that 99% of people have never heard. Always return valid JSON arrays with the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9, // High creativity for unique facts
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Groq API call failed:', error);
    throw error;
  }
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
  const newFacts = await fetchFromGroq(weightedTopics, dislikes, randomOnly);
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
      return count < 200; // Target 200+ facts per topic for better variety
    });
    
    if (topicsNeedingFacts.length === 0) return;
    
    // Pick random topics to generate for (prioritize user's topics)
    const priorityTopics = topicsNeedingFacts.filter(t => userTopics.includes(t));
    const otherTopics = topicsNeedingFacts.filter(t => !userTopics.includes(t));
    
    const topicsToGenerate = [
      ...shuffleArray(priorityTopics).slice(0, 3),
      ...shuffleArray(otherTopics).slice(0, 2)
    ];
    
    // Generate facts for each topic
    for (const topic of topicsToGenerate) {
      await generateFactsForTopic(topic);
    }
  } catch (e) {
    console.error('Pool generation error:', e);
  }
};

// Fetch facts from Groq AI
const fetchFromGroq = async (weightedTopics: string[], dislikes: string[], randomOnly: boolean): Promise<Fact[]> => {
  // Ultra-specific subtopics for maximum uniqueness
  const ultraSpecificSubtopics: Record<string, string[]> = {
    "Science": [
      "quantum tunneling in biological systems", "extremophile bacteria in radioactive waste", 
      "CRISPR applications in extinct species revival", "metamaterial physics breakthroughs",
      "synthetic biology creating new life forms", "dark matter detection experiments",
      "superconductor room temperature discoveries", "bioengineered organisms eating plastic"
    ],
    "Space": [
      "rogue planets ejected from solar systems", "magnetar magnetic field strength",
      "Oumuamua interstellar object mysteries", "exoplanet atmospheric compositions",
      "cosmic void supervoid structures", "gravitational wave chirp patterns",
      "pulsar timing array discoveries", "space archaeology on Mars"
    ],
    "History": [
      "lost Mayan codices recently discovered", "Roman concrete self-healing properties",
      "Viking trade routes to North America", "ancient Chinese earthquake detectors",
      "Antikythera mechanism gear calculations", "medieval Islamic surgical instruments",
      "Inca quipu knot-based record keeping", "Byzantine Greek fire composition secrets"
    ],
    "Technology": [
      "quantum computer error correction breakthroughs", "neuromorphic chip brain simulation",
      "DNA data storage capacity calculations", "photonic computing light-based processors",
      "metamaterial invisibility cloak progress", "brain-computer interface achievements",
      "synthetic spider silk production methods", "room-temperature fusion experiments"
    ],
    "Nature": [
      "bioluminescent fungi communication networks", "deep ocean hydrothermal vent ecosystems",
      "plant root internet mycorrhizal networks", "extremophile organisms in Antarctica",
      "carnivorous plant digestion mechanisms", "symbiotic relationships in coral reefs",
      "magnetic field navigation in animals", "chemosynthetic bacteria energy production"
    ],
    "Animals": [
      "octopus distributed brain intelligence", "tardigrade cryptobiosis survival mechanisms",
      "electric eel bioelectricity generation", "mantis shrimp compound eye vision",
      "dolphin echolocation precision capabilities", "arctic fox seasonal coat color changes",
      "honeybee waggle dance communication", "cuttlefish camouflage chromatophore control"
    ],
    "Human Body": [
      "microbiome influence on mood regulation", "telomere length and aging correlation",
      "circadian rhythm molecular clock mechanisms", "placebo effect neurological pathways",
      "synesthesia cross-sensory brain connections", "mirror neuron empathy responses",
      "gut-brain axis communication systems", "epigenetic inheritance mechanisms"
    ],
    "Psychology": [
      "collective intelligence emergence patterns", "decision fatigue neurological basis",
      "false memory implantation techniques", "cognitive load theory applications",
      "flow state brain wave patterns", "social contagion behavioral spread",
      "confirmation bias neural mechanisms", "temporal discounting future value perception"
    ]
  };

  // Build diverse topic list with ultra-specific subtopics
  const topicsToUse = weightedTopics.length > 0 ? weightedTopics : ALL_TOPICS;
  const selectedSubtopics: string[] = [];
  
  topicsToUse.forEach(topic => {
    const subs = ultraSpecificSubtopics[topic] || [topic];
    selectedSubtopics.push(...shuffleArray(subs).slice(0, 2));
  });

  const topicContext = shuffleArray(selectedSubtopics).slice(0, 6).join(", ");

  try {
    const prompt = `Generate 12 ULTRA-RARE, mind-blowing facts that 99.9% of people have never heard. Focus on: ${topicContext}

CRITICAL REQUIREMENTS:
- Facts must be VERIFIED from reputable scientific sources
- NO common facts found on typical "fun fact" lists
- Each fact should be genuinely shocking or counterintuitive
- Include specific numbers, dates, measurements, or scientific terms
- Facts should be recent discoveries (2020+) when possible
- Maximum 150 characters per fact for mobile readability
- Each fact must be from a DIFFERENT subtopic
- Prioritize facts that would make scientists say "Wait, what?!"

ABSOLUTELY AVOID these overused facts:
- Honey never spoils, octopus hearts, Venus day length, Cleopatra timeline
- Bananas are berries, sharks older than trees, Oxford older than Aztecs
- Wombat cube poop, mantis shrimp punch, neutron star density

Return as JSON object with "facts" array:
{
  "facts": [
    {
      "topic": "Science",
      "content": "Ultra-rare fact here with specific details",
      "sourceName": "Nature/Science/Cell/etc",
      "sourceUrl": "https://reputable-source.com"
    }
  ]
}`;

    const response = await callGroqAPI(prompt);
    
    if (!response.facts || !Array.isArray(response.facts)) {
      throw new Error('Invalid response format from Groq');
    }

    return response.facts.map((f: any) => ({
      ...f,
      id: `groq-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      liked: false,
      saved: false,
      xpEarned: false
    }));
  } catch (e) {
    console.error('Groq fetch error:', e);
    return [];
  }
};

// Generate many facts for a specific topic (for pool building)
export const generateFactsForTopic = async (topic: string): Promise<void> => {
  const ultraSpecificPrompts = {
    "Science": "cutting-edge research in quantum biology, synthetic biology breakthroughs, metamaterial discoveries",
    "Space": "recent exoplanet discoveries, interstellar object studies, gravitational wave astronomy findings",
    "History": "archaeological discoveries from 2020-2024, newly decoded ancient texts, historical revisionism",
    "Technology": "quantum computing milestones, neuromorphic engineering, DNA computing advances",
    "Nature": "newly discovered species, ecosystem interaction discoveries, climate adaptation mechanisms",
    "Animals": "animal cognition research, biomimicry applications, evolutionary biology findings",
    "Human Body": "microbiome research, epigenetics discoveries, neuroscience breakthroughs",
    "Psychology": "cognitive science findings, behavioral economics discoveries, social psychology research"
  };

  const specificPrompt = ultraSpecificPrompts[topic as keyof typeof ultraSpecificPrompts] || `recent discoveries in ${topic}`;

  try {
    const prompt = `Generate 20 ultra-specific, recently discovered facts about "${specificPrompt}" (category: ${topic}).

Requirements:
- Facts from 2020-2024 research when possible
- Include specific study names, researcher names, or institution names
- Numerical data, percentages, or measurements
- Counterintuitive or surprising findings
- Maximum 140 characters each
- NO commonly known facts
- Focus on cutting-edge research

Return JSON object:
{
  "facts": [
    {
      "topic": "${topic}",
      "content": "Specific recent discovery with numbers/names",
      "sourceName": "Research Institution/Journal",
      "sourceUrl": "https://source.com"
    }
  ]
}`;

    const response = await callGroqAPI(prompt);
    
    if (!response.facts || !Array.isArray(response.facts)) {
      console.error('Invalid response format for topic generation');
      return;
    }

    const facts = response.facts.map((f: any) => ({
      ...f,
      topic: topic, // Ensure consistent topic name
      id: `pool-groq-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      liked: false,
      saved: false,
      xpEarned: false
    }));
    
    if (facts.length > 0) {
      await saveFacts(facts);
      console.log(`Generated ${facts.length} facts for ${topic}`);
    }
  } catch (e) {
    console.error(`Topic generation error for ${topic}:`, e);
  }
};