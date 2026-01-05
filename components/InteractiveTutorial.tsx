
import React from 'react';

interface InteractiveTutorialProps {
  step: number;
  onAdvance: () => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ step, onAdvance }) => {
  if (step === 0) return null;

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500" />
      
      {step === 1 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
           <div className="w-20 h-20 rounded-full border-4 border-white/20 border-t-white animate-spin mb-8" />
           <div className="bg-white text-black p-6 rounded-[32px] max-w-xs text-center shadow-[0_0_50px_rgba(255,255,255,0.3)]">
              <h3 className="text-xl font-black uppercase mb-2">Swipe Up</h3>
              <p className="font-medium text-sm text-slate-600">The feed is infinite. Swipe to discover your first fact.</p>
           </div>
           <div className="absolute bottom-32 animate-bounce">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
           </div>
        </div>
      )}

      {step === 2 && (
        <div className="absolute right-20 bottom-32 flex items-center gap-4 animate-in slide-in-from-right duration-300">
            <div className="bg-rose-500 text-white p-4 rounded-[24px] shadow-xl text-center max-w-[200px]">
                <h3 className="font-black text-sm uppercase">Tap to Like</h3>
                <p className="text-xs opacity-90">Teach the algorithm what you love.</p>
            </div>
            <div className="w-4 h-4 bg-white rounded-full animate-ping" />
        </div>
      )}

      {step === 3 && (
        <div className="absolute right-20 bottom-52 flex items-center gap-4 animate-in slide-in-from-right duration-300">
             <div className="bg-sky-500 text-white p-4 rounded-[24px] shadow-xl text-center max-w-[200px]">
                <h3 className="font-black text-sm uppercase">Save for Later</h3>
                <p className="text-xs opacity-90">Build your personal knowledge deck.</p>
            </div>
            <div className="w-4 h-4 bg-white rounded-full animate-ping" />
        </div>
      )}

      {step === 4 && (
         <div className="absolute top-24 right-4 flex flex-col items-end gap-4 animate-in slide-in-from-top duration-300 pointer-events-auto">
             <div className="bg-orange-500 text-white p-6 rounded-[32px] shadow-xl text-center max-w-[250px]">
                <div className="text-4xl mb-2">🔥</div>
                <h3 className="font-black text-lg uppercase">Daily Streak</h3>
                <p className="text-sm opacity-90">Hit your daily XP goal to keep the flame alive!</p>
                <button onClick={onAdvance} className="mt-4 px-6 py-2 bg-white text-orange-600 rounded-full font-black text-xs uppercase shadow-lg">Got it!</button>
            </div>
         </div>
      )}
    </div>
  );
};
