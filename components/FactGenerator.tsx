
import React, { useState } from 'react';
import { generateSingleFact } from '../services/geminiService';
import { Fact, AppTheme } from '../types';
import { THEME_COLORS } from '../constants';

interface FactGeneratorProps {
  theme: AppTheme;
  onFactGenerated: (fact: Fact) => void;
  onClose: () => void;
}

export const FactGenerator: React.FC<FactGeneratorProps> = ({ theme, onFactGenerated, onClose }) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const colors = THEME_COLORS[theme];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const fact = await generateSingleFact(prompt);
    setLoading(false);
    if (fact) {
        onFactGenerated(fact);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'} ${colors.text}`}>
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg animate-pulse">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 12.5"/><path d="M12 12V2a10 10 0 0 1 10 10"/></svg>
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Fact Forge</h2>
            <p className="text-xs font-bold opacity-50 mt-1 uppercase tracking-widest">Generate specific knowledge</p>
        </div>

        <input 
          autoFocus
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. Black Holes, Coffee History..."
          className={`w-full p-5 rounded-3xl font-bold text-center outline-none mb-6 border-2 transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-100 focus:border-blue-500' : 'bg-black/20 border-white/5 focus:border-purple-500'} placeholder:opacity-30`}
        />

        <button 
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className={`w-full py-5 rounded-[24px] font-black text-white uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3
            ${loading ? 'bg-slate-400 cursor-wait' : 'bg-gradient-to-r from-purple-600 to-blue-600'}
          `}
        >
          {loading ? (
             <>
               <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               <span>Forging...</span>
             </>
          ) : (
             "Generate"
          )}
        </button>
      </div>
    </div>
  );
};
