
import React, { useState } from 'react';
import { THEME_COLORS } from '../constants';
import { AppTheme } from '../types';

interface AuthScreenProps {
  theme: AppTheme;
  onAuthenticate: (username: string, email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ theme, onAuthenticate }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colors = THEME_COLORS[theme];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'signup' && !username)) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onAuthenticate(username || email.split('@')[0], email);
    }, 1500);
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-6 ${colors.bg} ${colors.text}`}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className={`w-full max-w-sm p-8 rounded-[40px] shadow-2xl ${theme === 'light' ? 'bg-white border-slate-100' : 'bg-white/5 border-white/5'} border relative overflow-hidden z-10`}>
        
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-[28px] mx-auto mb-6 flex items-center justify-center shadow-lg rotate-12">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">FACT FLOW</h1>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Login to Sync Your Feed</p>
        </div>

        <div className="flex bg-black/5 p-1 rounded-full mb-8 relative z-10">
          <button onClick={() => setMode('signup')} className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === 'signup' ? 'bg-white shadow-md text-blue-600' : 'opacity-40'}`}>
            Sign Up
          </button>
          <button onClick={() => setMode('login')} className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white shadow-md text-blue-600' : 'opacity-40'}`}>
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest pl-4">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={`w-full p-4 rounded-2xl ${theme === 'light' ? 'bg-slate-50' : 'bg-black/20'} outline-none font-bold focus:ring-2 focus:ring-blue-500/50 transition-all`}
                placeholder="@username"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest pl-4">Email Access</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full p-4 rounded-2xl ${theme === 'light' ? 'bg-slate-50' : 'bg-black/20'} outline-none font-bold focus:ring-2 focus:ring-blue-500/50 transition-all`}
              placeholder="hello@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest pl-4">Security Key</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full p-4 rounded-2xl ${theme === 'light' ? 'bg-slate-50' : 'bg-black/20'} outline-none font-bold focus:ring-2 focus:ring-blue-500/50 transition-all`}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-3xl font-black text-white uppercase tracking-widest shadow-xl mt-4 active:scale-95 transition-all ${loading ? 'bg-slate-400' : 'bg-blue-600'}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Syncing...
              </span>
            ) : (
              mode === 'signup' ? 'Create Profile' : 'Access Feed'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
