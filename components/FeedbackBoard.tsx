
import React, { useState } from 'react';
import { Feedback, AppTheme } from '../types';
import { THEME_COLORS } from '../constants';

interface FeedbackBoardProps {
  theme: AppTheme;
  feedbacks: Feedback[];
  onLike: (id: string) => void;
  onSubmit: (text: string, type: 'feature' | 'bug' | 'content') => void;
}

const BackgroundPattern = () => (
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
);

export const FeedbackBoard: React.FC<FeedbackBoardProps> = ({ theme, feedbacks, onLike, onSubmit }) => {
  const [newText, setNewText] = useState("");
  const [type, setType] = useState<'feature' | 'bug' | 'content'>('feature');
  const [filter, setFilter] = useState<'all' | 'feature' | 'bug' | 'content'>('all');
  const colors = THEME_COLORS[theme];

  const filtered = filter === 'all' ? feedbacks : feedbacks.filter(f => f.type === filter);

  const handleSubmit = () => {
    if (!newText.trim()) return;
    onSubmit(newText, type);
    setNewText("");
  };

  return (
    <div className={`fixed inset-0 overflow-y-auto pt-24 px-6 pb-32 ${colors.bg} ${colors.text}`}>
       <BackgroundPattern />
       <div className="max-w-md mx-auto relative z-10">
         <h1 className="text-4xl font-black italic mb-2">COMMUNITY</h1>
         <p className="text-xs font-bold opacity-50 uppercase tracking-widest mb-8">Shape the future of Fact Flow</p>

         {/* Input Area */}
         <div className={`p-6 rounded-[32px] shadow-lg mb-8 ${theme === 'light' ? 'bg-white' : 'bg-white/5 border border-white/10'}`}>
            <textarea 
               value={newText}
               onChange={e => setNewText(e.target.value)}
               placeholder="Suggest a feature, report a bug, or request a topic..."
               className={`w-full p-4 h-24 rounded-2xl mb-4 font-bold text-sm resize-none outline-none ${theme === 'light' ? 'bg-slate-50' : 'bg-black/20 text-white'}`}
            />
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                {(['feature', 'bug', 'content'] as const).map(t => (
                    <button 
                      key={t} 
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${type === t ? 'bg-blue-600 text-white border-transparent' : 'border-current opacity-40 hover:opacity-100'}`}
                    >
                      {t}
                    </button>
                ))}
            </div>
            <button onClick={handleSubmit} className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors">
                Submit Feedback
            </button>
         </div>

         {/* Filter Tabs */}
         <div className="flex gap-4 mb-6 overflow-x-auto no-scrollbar pb-2">
            <button onClick={() => setFilter('all')} className={`text-xs font-black uppercase ${filter === 'all' ? 'opacity-100 underline decoration-4 decoration-blue-500' : 'opacity-40'}`}>All</button>
            <button onClick={() => setFilter('feature')} className={`text-xs font-black uppercase ${filter === 'feature' ? 'opacity-100 underline decoration-4 decoration-purple-500' : 'opacity-40'}`}>Features</button>
            <button onClick={() => setFilter('bug')} className={`text-xs font-black uppercase ${filter === 'bug' ? 'opacity-100 underline decoration-4 decoration-rose-500' : 'opacity-40'}`}>Bugs</button>
            <button onClick={() => setFilter('content')} className={`text-xs font-black uppercase ${filter === 'content' ? 'opacity-100 underline decoration-4 decoration-emerald-500' : 'opacity-40'}`}>Content</button>
         </div>

         {/* List */}
         <div className="space-y-4">
             {filtered.map(f => (
                 <div key={f.id} className={`p-5 rounded-[24px] ${theme === 'light' ? 'bg-white' : 'bg-white/5 border border-white/10'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${f.type === 'feature' ? 'bg-purple-500' : f.type === 'bug' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] font-black uppercase opacity-50">{f.type}</span>
                        </div>
                        <span className="text-[10px] font-bold opacity-30">{new Date(f.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="font-bold mb-3">{f.text}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black opacity-40">@{f.username}</span>
                        <button onClick={() => onLike(f.id)} className="flex items-center gap-1 text-xs font-black opacity-60 hover:opacity-100 transition-opacity">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                            {f.likes}
                        </button>
                    </div>
                 </div>
             ))}
         </div>
       </div>
    </div>
  );
};

export default FeedbackBoard;