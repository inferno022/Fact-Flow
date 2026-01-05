
import React, { useState } from 'react';
import { INITIAL_TOPICS, THEME_COLORS } from '../constants';
import { AppTheme } from '../types';

interface HiveProps {
  theme: AppTheme;
  selectedInterests: string[];
  onToggle: (topic: string) => void;
  onContinue: () => void;
}

export const HiveTopicSelector: React.FC<HiveProps> = ({ theme, selectedInterests, onToggle, onContinue }) => {
  const [search, setSearch] = useState("");
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const colors = THEME_COLORS[theme];
  
  const allAvailable = Array.from(new Set([...INITIAL_TOPICS, ...customTopics]));
  const filtered = allAvailable.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = () => {
    const trimmed = search.trim();
    if (trimmed && !allAvailable.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setCustomTopics(prev => [trimmed, ...prev]); // Add to top
      onToggle(trimmed);
      setSearch("");
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${colors.bg} ${colors.text}`}>
      
      {/* Header */}
      <div className="pt-8 px-6 pb-4 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-3xl font-black tracking-tighter mb-1">THE ALGORITHM</h1>
        <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.3em]">Select at least 3 seed topics</p>
        
        <div className="mt-6 flex gap-2">
           <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Search or Create Topic..."
            className={`flex-1 py-4 px-6 rounded-full font-bold text-sm outline-none shadow-xl ${theme === 'light' ? 'bg-white text-black' : 'bg-white/10 text-white backdrop-blur-md'}`}
           />
           {search && !filtered.includes(search) && (
             <button onClick={handleCreate} className="bg-blue-600 text-white px-6 rounded-full font-black text-xl shadow-lg active:scale-90 transition-transform">+</button>
           )}
        </div>
      </div>

      {/* Honeycomb Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative p-4">
        <div className="flex flex-wrap justify-center pb-32 pt-4">
           {filtered.map((topic, i) => {
             const isSelected = selectedInterests.includes(topic);
             // Hexagon-ish styling via CSS clip-path or shape
             return (
               <div 
                  key={topic} 
                  className={`relative m-2 transition-all duration-300 ${isSelected ? 'scale-110 z-10' : 'scale-100 opacity-60 hover:opacity-100'}`}
                  style={{ 
                    marginTop: (i % 2 === 0) ? '0px' : '30px', // Stagger effect
                    marginBottom: (i % 2 === 0) ? '30px' : '0px'
                  }}
               >
                 <button
                    onClick={() => onToggle(topic)}
                    className={`
                      w-28 h-28 flex items-center justify-center p-2 text-center text-[10px] font-black uppercase tracking-wider
                      clip-hex transition-all duration-300 shadow-2xl
                      ${isSelected 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                        : theme === 'light' ? 'bg-white text-slate-800' : 'bg-white/10 text-white'}
                    `}
                    style={{
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
                    }}
                 >
                   {topic}
                 </button>
                 {isSelected && (
                   <div className="absolute inset-0 bg-blue-500/30 blur-xl -z-10 animate-pulse" />
                 )}
               </div>
             );
           })}
        </div>
      </div>

      {/* Footer Action */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
         <button
          onClick={onContinue}
          disabled={selectedInterests.length < 3}
          className={`w-full py-6 rounded-[32px] font-black text-lg transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3
            ${selectedInterests.length >= 3 ? 'bg-white text-black' : 'bg-white/20 text-white/40 cursor-not-allowed'}
          `}
        >
          {selectedInterests.length >= 3 ? (
             <>
               <span>INITIATE FEED</span>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
             </>
          ) : (
            `SELECT ${3 - selectedInterests.length} MORE`
          )}
        </button>
      </div>
    </div>
  );
};
