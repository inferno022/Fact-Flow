// Run this script to pre-populate your Supabase cache with facts
// Usage: npx ts-node scripts/populate-cache.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://libcgvamzfkuhfexxfgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYmNndmFtemZrdWhmZXh4Zmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1Mjc5NDAsImV4cCI6MjA4MzEwMzk0MH0.IONJmi_R5xgamcbj-qL9kWO_-7DV6_0ofQ1TFEXMxf8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Pre-generated facts to populate cache
const facts = [
  { id: 'f1', topic: 'Space', content: 'A day on Venus is longer than its year - 243 Earth days to rotate once.', source_name: 'NASA', source_url: 'https://nasa.gov' },
  { id: 'f2', topic: 'Biology', content: 'Octopuses have three hearts and blue blood.', source_name: 'National Geographic', source_url: 'https://nationalgeographic.com' },
  { id: 'f3', topic: 'History', content: 'Cleopatra lived closer to the Moon landing than to the Great Pyramid construction.', source_name: 'Smithsonian', source_url: 'https://smithsonianmag.com' },
  { id: 'f4', topic: 'Technology', content: 'The first computer bug was a real moth found in Harvard Mark II in 1947.', source_name: 'Computer History', source_url: 'https://computerhistory.org' },
  { id: 'f5', topic: 'Nature', content: 'Honey never spoils. 3000-year-old honey from Egyptian tombs was still edible.', source_name: 'Smithsonian', source_url: 'https://smithsonianmag.com' },
  { id: 'f6', topic: 'Psychology', content: 'Your brain uses 20% of your energy but is only 2% of your body weight.', source_name: 'Scientific American', source_url: 'https://scientificamerican.com' },
  { id: 'f7', topic: 'Ocean', content: 'We have better maps of Mars than our ocean floor. 80% remains unexplored.', source_name: 'NOAA', source_url: 'https://noaa.gov' },
  { id: 'f8', topic: 'Animals', content: 'Crows recognize human faces and hold grudges for years.', source_name: 'Cornell Lab', source_url: 'https://birds.cornell.edu' },
  { id: 'f9', topic: 'Physics', content: 'If you could fold paper 42 times, it would reach the Moon.', source_name: 'Physics Today', source_url: 'https://physicstoday.org' },
  { id: 'f10', topic: 'Human Body', content: 'Your body has enough iron to make a 3-inch nail.', source_name: 'Live Science', source_url: 'https://livescience.com' },
  { id: 'f11', topic: 'Geography', content: 'Russia has 11 time zones, more than any other country.', source_name: 'World Atlas', source_url: 'https://worldatlas.com' },
  { id: 'f12', topic: 'Music', content: 'The song "Happy Birthday" was copyrighted until 2016.', source_name: 'NPR', source_url: 'https://npr.org' },
  { id: 'f13', topic: 'Food', content: 'Bananas are berries, but strawberries are not.', source_name: 'Britannica', source_url: 'https://britannica.com' },
  { id: 'f14', topic: 'Language', content: 'The dot over the letters i and j is called a tittle.', source_name: 'Merriam-Webster', source_url: 'https://merriam-webster.com' },
  { id: 'f15', topic: 'Sports', content: 'Golf balls have 336 dimples on average for better aerodynamics.', source_name: 'Golf Digest', source_url: 'https://golfdigest.com' },
  { id: 'f16', topic: 'Science', content: 'Hot water freezes faster than cold water. This is called the Mpemba effect.', source_name: 'Nature', source_url: 'https://nature.com' },
  { id: 'f17', topic: 'Art', content: 'The Mona Lisa has no eyebrows - it was fashion in Renaissance Florence.', source_name: 'Louvre', source_url: 'https://louvre.fr' },
  { id: 'f18', topic: 'Medicine', content: 'Humans share 60% of their DNA with bananas.', source_name: 'NIH', source_url: 'https://nih.gov' },
  { id: 'f19', topic: 'Weather', content: 'Lightning strikes Earth about 8 million times per day.', source_name: 'NOAA', source_url: 'https://noaa.gov' },
  { id: 'f20', topic: 'Economics', content: 'There is more money printed for Monopoly than real US currency each year.', source_name: 'Hasbro', source_url: 'https://hasbro.com' },
  { id: 'f21', topic: 'Astronomy', content: 'Neutron stars are so dense that a teaspoon would weigh 6 billion tons.', source_name: 'NASA', source_url: 'https://nasa.gov' },
  { id: 'f22', topic: 'Chemistry', content: 'Water can boil and freeze at the same time at the triple point.', source_name: 'ACS', source_url: 'https://acs.org' },
  { id: 'f23', topic: 'Architecture', content: 'The Great Wall of China is not visible from space with the naked eye.', source_name: 'NASA', source_url: 'https://nasa.gov' },
  { id: 'f24', topic: 'Insects', content: 'A flea can jump 150 times its body length - like a human jumping over a skyscraper.', source_name: 'Entomology Today', source_url: 'https://entomologytoday.org' },
  { id: 'f25', topic: 'Mathematics', content: 'There are more possible chess games than atoms in the observable universe.', source_name: 'Chess.com', source_url: 'https://chess.com' },
  { id: 'f26', topic: 'Plants', content: 'Bamboo can grow up to 35 inches in a single day.', source_name: 'Botanical Garden', source_url: 'https://botanicalgarden.org' },
  { id: 'f27', topic: 'Movies', content: 'The Wilhelm scream has been used in over 400 films since 1951.', source_name: 'IMDb', source_url: 'https://imdb.com' },
  { id: 'f28', topic: 'Geology', content: 'Diamonds can be made from peanut butter under extreme pressure.', source_name: 'Geology.com', source_url: 'https://geology.com' },
  { id: 'f29', topic: 'Sleep', content: 'Humans spend about 1/3 of their lives sleeping - roughly 26 years.', source_name: 'Sleep Foundation', source_url: 'https://sleepfoundation.org' },
  { id: 'f30', topic: 'Internet', content: 'The first website ever created is still online at info.cern.ch.', source_name: 'CERN', source_url: 'https://cern.ch' },
];

async function populate() {
  console.log('Populating cache with', facts.length, 'facts...');
  
  const { error } = await supabase
    .from('cached_facts')
    .upsert(facts, { onConflict: 'id' });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Done! Cache populated.');
  }
}

populate();
