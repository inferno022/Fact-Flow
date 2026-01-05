
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Fact, UserProfile, AppTheme, AppView, Feedback, Reply, Deck } from './types';
import { THEME_COLORS, XP_PER_FACT, XP_FOR_FIRST_LEVEL, LIGHT_GRADIENTS, DARK_GRADIENTS, DECK_COLORS } from './constants';
import { getFacts } from './services/groqService';
import { saveUserProfile, createShareLink, getSharedFact, markFactSeen, likeFact, trackFactInSession, loadSeenFactsFromDB } from './services/cacheService';
import { soundService } from './services/soundService';
import { initNotificationService } from './services/notificationService';
import { initAdMob, showInterstitialAd } from './services/adService';
import { FeedAd } from './components/AdBanner';
import { NavBar } from './components/NavBar';
import { AuthScreen } from './components/AuthScreen';
import { initMobileConfig } from './config/mobile';

import { FeedbackBoard } from './components/FeedbackBoard';

const Confetti = () => {
  const [particles] = useState(() => Array.from({ length: 20 }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 8 + 4,
    color: ["#FF7518", "#002366", "#3B82F6", "#10B981", "#F43F5E", "#EAB308"][Math.floor(Math.random() * 6)],
    delay: Math.random() * 1,
    duration: Math.random() * 2 + 1,
    rot: Math.random() * 360
  })));

  return (
    <div className="fixed inset-0 pointer-events-none z-[400] overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `-10%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
            transform: `rotate(${p.rot}deg)`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
  <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mb-4">{children}</h3>
);

// Shared background pattern for consistency
const BackgroundPattern = () => (
  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
);

const App: React.FC = () => {
  const [theme, setTheme] = useState<AppTheme>(() => localStorage.getItem('fact-theme') as AppTheme || 'dark');
  const [view, setViewState] = useState<AppView>('auth');
  
  // Debug wrapper for setView
  const setView = (newView: AppView) => {
    console.log('View change:', { from: view, to: newView });
    setViewState(newView);
  };
  const [facts, setFacts] = useState<Fact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('fact-user');
    const defaultUser: UserProfile = {
      username: "",
      isAuthenticated: false,
      bio: "Collector of curiosities.",
      pfpUrl: `https://picsum.photos/seed/curiosity/300`,
      level: 1,
      xp: 0,
      nextLevelXp: XP_FOR_FIRST_LEVEL,
      
      // Streak Data
      streak: 0,
      lastGoalDate: "",
      dailyGoal: 100,
      dailyXp: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],

      isCurated: true,
      onboardingComplete: true,
      badges: [
        { type: 'easy', count: 0 },
        { type: 'medium', count: 0 },
        { type: 'hard', count: 0 }
      ],
      interests: [],
      topicWeights: {},
      dislikedTopics: [],
      decks: [{ id: 'default', name: 'General', color: 'bg-blue-500' }]
    };
    return saved ? { ...defaultUser, ...JSON.parse(saved) } : defaultUser;
  });

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([
    { id: '1', username: 'Fact Flow', type: 'feature', text: 'Algorithm initializing. The more you interact, the better I get.', likes: 99, replies: [], timestamp: Date.now() }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [levelUpPopup, setLevelUpPopup] = useState<number | null>(null);
  const [showDeckPicker, setShowDeckPicker] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [viewingFactFromDeck, setViewingFactFromDeck] = useState<Fact | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const colors = THEME_COLORS[theme];

  // Splash screen with intro sound using Howler
  useEffect(() => {
    // Initialize mobile configuration
    initMobileConfig();
    
    // Play intro sound and get duration
    const duration = soundService.playIntro();
    
    // Keep splash for sound duration + 1 second
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, duration + 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initSound = () => {
      soundService.init();
      document.removeEventListener('click', initSound);
      document.removeEventListener('touchstart', initSound);
    };
    document.addEventListener('click', initSound);
    document.addEventListener('touchstart', initSound);
    return () => {
      document.removeEventListener('click', initSound);
      document.removeEventListener('touchstart', initSound);
    };
  }, []);

  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (navigator.vibrate) {
      const duration = intensity === 'heavy' ? 100 : intensity === 'medium' ? 50 : 20;
      navigator.vibrate(duration);
    }
  };

  useEffect(() => { localStorage.setItem('fact-user', JSON.stringify(user)); saveUserProfile(user); }, [user]);
  useEffect(() => { localStorage.setItem('fact-theme', theme); }, [theme]);
  
  // Daily Streak Check
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== today) {
        // New day
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const missedDay = user.lastActiveDate !== yesterday;
        
        setUser(prev => ({
            ...prev,
            dailyXp: 0,
            lastActiveDate: today,
            streak: missedDay ? 0 : prev.streak // Reset streak if missed day
        }));
    }
  }, []);

  useEffect(() => {
    if (user.isAuthenticated && view === 'auth') {
        setView('feed'); // Go directly to feed - no curation
    }
    // Load seen facts from DB on startup to prevent duplicates
    if (user.isAuthenticated && user.email) {
      loadSeenFactsFromDB(user.email);
      // Initialize notifications
      initNotificationService(user.email, user.username);
      // Initialize AdMob for native app
      initAdMob();
    }
  }, [user.isAuthenticated, user.email]);

  // Handle deep links - check if opened with a shared fact URL
  useEffect(() => {
    const handleDeepLink = async () => {
      const path = window.location.pathname;
      const match = path.match(/\/f\/([a-z0-9]+)/i);
      
      if (match) {
        const shareId = match[1];
        const sharedFact = await getSharedFact(shareId);
        
        if (sharedFact) {
          // Add shared fact to beginning of feed
          setFacts(prev => [sharedFact, ...prev.filter(f => f.id !== sharedFact.id)]);
          setCurrentIndex(0);
          
          // Clear the URL
          window.history.replaceState({}, '', '/');
          
          // Make sure we're on feed view
          if (user.isAuthenticated) {
            setView('feed');
          }
        }
      }
    };
    
    handleDeepLink();
  }, [user.isAuthenticated]);



  const loadMoreFacts = async () => {
    if (loading) return;
    setLoading(true);
    setLoadProgress(20);
    
    setLoadProgress(40);
    
    // Get random facts from all topics
    const newFacts = await getFacts([], [], false, user.email);
    setLoadProgress(80);
    
    // Deduplication & Ad Logic
    const existingIds = new Set(facts.map(f => f.id));
    const existingContent = new Set(facts.map(f => f.content.toLowerCase().substring(0, 50)));
    const processed: Fact[] = [];
    let lastTopic = facts.length > 0 ? facts[facts.length - 1].topic : "";
    for(const f of newFacts) {
      // Skip if already in feed (by ID or similar content)
      if (existingIds.has(f.id)) continue;
      if (existingContent.has(f.content.toLowerCase().substring(0, 50))) continue;
      // Skip consecutive same topics
      if (f.topic === lastTopic) continue; 
      processed.push(f);
      existingIds.add(f.id);
      existingContent.add(f.content.toLowerCase().substring(0, 50));
      lastTopic = f.topic;
    }
    const adInterval = 8;
    const currentTotal = facts.length;
    if (Math.floor((currentTotal + processed.length) / adInterval) > Math.floor(currentTotal / adInterval)) {
      processed.splice(2, 0, {
        id: `ad-${Date.now()}`, topic: "Sponsored", content: "AD_PLACEHOLDER", sourceName: "Ads", sourceUrl: "#", liked: false, saved: false, xpEarned: true, isAd: true
      });
    }

    setLoadProgress(100);
    
    // Track all new facts in session immediately to prevent duplicates
    processed.forEach(f => {
      if (!f.isAd) trackFactInSession(f);
    });
    
    setFacts(prev => [...prev, ...processed]);
    
    // Quick transition
    setTimeout(() => {
      setLoading(false);
      setLoadProgress(0);
    }, 150);
  };

  useEffect(() => {
    if (user.isAuthenticated && (view === 'feed' || view === 'explore') && facts.length === 0) {
      loadMoreFacts();
    }
  }, [view, user.isAuthenticated]);

  const addXP = (amount: number) => {
    setUser(prev => {
      let xp = prev.xp + amount;
      let dailyXp = prev.dailyXp + amount;
      let lvl = prev.level;
      let next = prev.nextLevelXp;
      let streak = prev.streak;
      let lastGoalDate = prev.lastGoalDate;
      const today = new Date().toISOString().split('T')[0];

      // Streak Logic
      if (dailyXp >= prev.dailyGoal && lastGoalDate !== today) {
          streak += 1;
          lastGoalDate = today;
      }

      if (xp >= next) {
        lvl++; xp -= next; next = Math.floor(next * 1.5);
        triggerHaptic('heavy');
        soundService.playLevelUp();
        setLevelUpPopup(lvl); setTimeout(() => setLevelUpPopup(null), 4000);
      }
      return { ...prev, xp, dailyXp, level: lvl, nextLevelXp: next, streak, lastGoalDate };
    });
  };

  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = useCallback(() => {
    if (!feedRef.current || (view !== 'feed' && view !== 'explore')) return;
    
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Set new timeout to detect scroll end
    const newTimeout = setTimeout(() => {
      if (!feedRef.current) return;
      
      const scrollTop = feedRef.current.scrollTop;
      const index = Math.round(scrollTop / window.innerHeight);
      
      // Force snap to exact position
      const targetScrollTop = index * window.innerHeight;
      if (Math.abs(scrollTop - targetScrollTop) > 10) {
        feedRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'auto'
        });
      }
      
      if (index !== currentIndex) {
        setCurrentIndex(index);
        triggerHaptic('light');
        
        const viewedFact = facts[index];
        if (viewedFact && !viewedFact.isAd) {
           // Mark fact as seen in session + Supabase (prevents showing again)
           if (user.email) {
             markFactSeen(viewedFact.id, user.email, viewedFact.content);
           } else {
             // Even without email, track in session
             trackFactInSession(viewedFact);
           }
        }

        // Show interstitial ad every 8 facts on native
        if (index > 0 && index % 8 === 0 && !viewedFact?.isAd) {
          showInterstitialAd();
        }

        if (index >= facts.length - 3) loadMoreFacts();
        if (facts[index] && !facts[index].xpEarned) {
          setFacts(p => p.map((f, idx) => idx === index ? { ...f, xpEarned: true } : f));
          addXP(XP_PER_FACT);
        }
      }
      
      setIsScrolling(false);
    }, 100); // 100ms delay for snap detection
    
    setScrollTimeout(newTimeout);
  }, [currentIndex, facts, loading, view, user.email, scrollTimeout]);

  const handleAuth = (username: string, email: string) => {
      console.log('Authentication successful', { username, email });
      setUser(u => ({ ...u, username, email, isAuthenticated: true }));
      setView('feed'); // Go directly to feed
  };

  const handleLike = (fact: Fact) => {
      triggerHaptic('medium');
      soundService.playLike();
      const newLiked = !fact.liked;
      setFacts(p => p.map(f => f.id === fact.id ? { ...f, liked: newLiked } : f));
      // Update global like count in Supabase
      if (user.email) {
          likeFact(fact.id, user.email, newLiked);
      }
  };

  const handleSaveToDeck = (factId: string, deckId: string) => {
    triggerHaptic('light');
    soundService.playSave();
    setFacts(p => p.map(f => f.id === factId ? { ...f, saved: true, deckId } : f));
    setShowDeckPicker(null);
  };

  const createNewDeck = (name: string) => {
    const newDeck: Deck = { id: Math.random().toString(36).substr(2, 9), name, color: DECK_COLORS[user.decks.length % DECK_COLORS.length] };
    setUser(u => ({ ...u, decks: [...u.decks, newDeck] }));
    return newDeck.id;
  };

  const handleFeedbackSubmit = (text: string, type: 'feature' | 'bug' | 'content') => {
      setFeedbacks(prev => [{ id: Math.random().toString(36).substring(2), username: user.username, type, text, likes: 0, replies: [], timestamp: Date.now() }, ...prev]);
  };

  // Handle profile picture upload
  const handlePfpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUser(u => ({ ...u, pfpUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Start editing profile
  const startEditProfile = () => {
    setEditName(user.username);
    setEditBio(user.bio);
    setEditingProfile(true);
  };

  // Save profile changes
  const saveProfile = () => {
    setUser(u => ({ 
      ...u, 
      username: editName.trim() || u.username,
      bio: editBio.trim() || u.bio
    }));
    setEditingProfile(false);
  };

  // Generate shareable card image
  const generateShareCard = async (fact: Fact): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Add pattern dots
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < 1080; x += 30) {
      for (let y = 0; y < 1920; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Topic pill
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    const topicWidth = ctx.measureText(fact.topic.toUpperCase()).width + 80;
    ctx.beginPath();
    ctx.roundRect((1080 - topicWidth) / 2, 700, topicWidth, 60, 30);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(fact.topic.toUpperCase(), 540, 740);

    // Main fact text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px system-ui';
    ctx.textAlign = 'center';
    
    // Word wrap
    const words = fact.content.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = 900;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = 70;
    const startY = 960 - (lines.length * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, 540, startY + i * lineHeight);
    });

    // Branding
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 32px system-ui';
    ctx.fillText('FACT FLOW', 540, 1700);
    
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '24px system-ui';
    ctx.fillText('Swipe for more facts', 540, 1750);

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/png', 0.9);
    });
  };

  const handleShare = async (type: 'image' | 'link' | 'copy') => {
    const fact = facts[currentIndex];
    if (!fact) return;
    
    triggerHaptic('medium');
    
    // Create shareable link in Supabase
    const shareUrl = await createShareLink(fact, user.username);
    const shareText = `Check out this fact, you might like it!\n\n${shareUrl}`;
    
    // Fallback URL for Play Store if app not installed
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=io.factflow.app';

    if (type === 'copy') {
      await navigator.clipboard.writeText(shareText);
      setShowShareModal(false);
      return;
    }

    if (type === 'link') {
      if (navigator.share) {
        await navigator.share({ 
          title: 'Fact Flow', 
          text: 'Check out this fact, you might like it!',
          url: shareUrl 
        });
      }
      setShowShareModal(false);
      return;
    }

    // Share as image (like Instagram/TikTok)
    if (type === 'image') {
      const blob = await generateShareCard(fact);
      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'fact.png', { type: 'image/png' })] })) {
        const file = new File([blob], 'fact-flow.png', { type: 'image/png' });
        await navigator.share({
          title: 'Fact Flow',
          text: `Check out this fact!\n${shareUrl}`,
          files: [file]
        });
      } else if (blob) {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fact-flow.png';
        a.click();
        URL.revokeObjectURL(url);
      }
      setShowShareModal(false);
    }
  };

  return (
    <div className={`fixed inset-0 overflow-hidden transition-colors duration-500 font-jakarta ${colors.bg} ${colors.text}`}>
      
      {/* Splash Screen with Intro Sound */}
      {showSplash && (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center">
          {/* Background Image */}
          <img 
            src="/splash-bg.png" 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Logo */}
          <div className="relative z-10 mb-6">
            <img 
              src="/logo.png" 
              alt="Fact Flow" 
              className="w-64 h-64 object-contain animate-pulse"
              style={{ animationDuration: '2s' }}
            />
          </div>
          
          {/* Brand Name */}
          <h1 className="relative z-10 text-4xl font-black text-white tracking-tight mb-2 drop-shadow-lg">FACT FLOW</h1>
          <p className="relative z-10 text-white/60 text-xs font-bold uppercase tracking-[0.3em] mb-12 drop-shadow">Learn Something New</p>
          
          {/* Loading indicator */}
          <div className="relative z-10 flex gap-2">
            {[0, 1, 2].map(i => (
              <div 
                key={i} 
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Universal Background Pattern */}
      <BackgroundPattern />

      {/* Loading Screen - Progress Bar */}
      {loading && facts.length === 0 && user.isAuthenticated && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/95 px-8">
           <img src="/logo.png" alt="Fact Flow" className="w-32 h-32 mb-8 object-contain" />
           <h2 className="text-2xl font-black text-white tracking-tight mb-2">FACT FLOW</h2>
           <p className="text-white/40 font-bold text-xs uppercase tracking-widest mb-8">Loading your feed</p>
           
           {/* Progress Bar */}
           <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden mb-4">
             <div 
               className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
               style={{ width: `${loadProgress}%` }}
             />
           </div>
           <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{loadProgress}%</p>
           <p className="text-white/20 text-[10px] font-medium mt-6">Make sure your connection is good</p>
        </div>
      )}

      {view === 'auth' && <AuthScreen theme={theme} onAuthenticate={handleAuth} />}
      
      {(view === 'feed' || view === 'explore') && (
        <div ref={feedRef} onScroll={handleScroll} className="snap-y-container h-full w-full relative no-scrollbar">
          
          {/* Daily Goal / Streak Indicator Overlay (Only on feed) */}
          <div className="fixed top-0 left-0 right-0 p-4 z-40 pointer-events-none flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-2 pointer-events-auto bg-black/30 backdrop-blur-md p-2 rounded-full border border-white/5">
                 <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 23c-3.866 0-7-3.134-7-7 0-2.5 1.5-4.5 3-6 .5-.5 1-1 1.5-1.5C10 8 10.5 7 10.5 6c0-.5-.5-1-1-1.5-.5-.5-1-1-1-1.5 0-1 1-2 2-2 .5 0 1 .5 1.5 1 1 1 2 2.5 2 4 0 1-.5 2-1 3-.5 1-1 2-1 3 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-1-.5-2-1-3 2 1.5 3 4 3 6.5 0 3.866-3.134 7-7 7z"/></svg>
                 </div>
                 <div className="pr-3">
                    <div className="text-[10px] font-black uppercase text-white/60">Streak</div>
                    <div className="text-sm font-black text-white leading-none">{user.streak} Days</div>
                 </div>
              </div>
          </div>

          {facts.map((fact, i) => (
            <div key={fact.id} className="snap-item w-full h-full flex items-center justify-center p-6 pb-32 relative">
              {fact.isAd ? (
                <FeedAd adSlot="1234567890" />
              ) : (
                <div className={`w-full max-w-sm h-[55%] p-8 rounded-[48px] shadow-2xl relative overflow-hidden transition-all duration-700 transform ${currentIndex === i ? 'scale-100 rotate-0 opacity-100' : 'scale-90 rotate-2 opacity-50'}`} style={{ marginBottom: '15%' }}>
                  {/* Card Background - Updated for richer dark mode */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme === 'light' ? LIGHT_GRADIENTS[i % LIGHT_GRADIENTS.length] : DARK_GRADIENTS[i % DARK_GRADIENTS.length]}`} />
                  {/* Subtle Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  {/* Content Container */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center h-full space-y-6 px-4">
                     <div className="inline-block px-6 py-2 bg-black/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-lg">
                        {fact.topic}
                     </div>
                     <h2 className={`font-black leading-tight tracking-tight text-white drop-shadow-md ${fact.content.length > 80 ? 'text-xl' : 'text-2xl'}`}>
                        {fact.content}
                     </h2>
                     <a href={fact.sourceUrl} target="_blank" className="flex items-center gap-2 text-[10px] font-black text-white/50 hover:text-white uppercase tracking-widest transition-colors bg-black/10 px-4 py-2 rounded-full">
                        Source: {fact.sourceName} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                     </a>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Fixed Action Buttons - Overlay at bottom 3/7th of screen */}
          {facts.length > 0 && facts[currentIndex] && !facts[currentIndex].isAd && (
            <div className="fixed bottom-28 left-0 right-0 z-50 flex justify-center items-center gap-4 px-6">
              <button onClick={() => handleLike(facts[currentIndex])} className="flex flex-col items-center gap-1 group">
                <div className={`p-3 rounded-full backdrop-blur-xl transition-all shadow-2xl border border-white/10 ${facts[currentIndex].liked ? 'bg-rose-500 text-white scale-110' : 'bg-black/40 text-white hover:bg-black/60'}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={facts[currentIndex].liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <span className="text-[9px] font-black text-white drop-shadow-lg">{facts[currentIndex].liked ? 'Liked' : 'Like'}</span>
              </button>

              <button onClick={() => setShowDeckPicker(facts[currentIndex].id)} className="flex flex-col items-center gap-1 group">
                 <div className={`p-3 rounded-full backdrop-blur-xl transition-all shadow-2xl border border-white/10 ${facts[currentIndex].saved ? 'bg-sky-500 text-white scale-110' : 'bg-black/40 text-white hover:bg-black/60'}`}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill={facts[currentIndex].saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                 </div>
                 <span className="text-[9px] font-black text-white drop-shadow-lg">{facts[currentIndex].saved ? 'Saved' : 'Save'}</span>
              </button>
              
              <button onClick={() => { triggerHaptic(); soundService.playShare(); setShowShareModal(true); }} className="flex flex-col items-center gap-1 group">
                 <div className="p-3 rounded-full bg-black/40 backdrop-blur-xl text-white hover:bg-black/60 transition-all shadow-2xl border border-white/10">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                 </div>
                 <span className="text-[9px] font-black text-white drop-shadow-lg">Share</span>
              </button>
            </div>
          )}
          
          {loading && <div className="absolute bottom-10 left-0 right-0 text-center text-xs font-black opacity-50 animate-pulse">Fetching more intelligence...</div>}
        </div>
      )}

      {showDeckPicker && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'} w-full max-w-sm rounded-[48px] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300`}>
            <h3 className="text-xl font-black tracking-tight text-center">ORGANIZE KNOWLEDGE</h3>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto no-scrollbar">
              {user.decks.map(deck => (
                <button key={deck.id} onClick={() => handleSaveToDeck(showDeckPicker, deck.id)} className={`p-4 rounded-[24px] ${deck.color} text-white font-black text-[10px] uppercase shadow-md active:scale-95 transition-all`}>{deck.name}</button>
              ))}
              <button onClick={() => { const name = prompt("Deck Name:"); if(name) handleSaveToDeck(showDeckPicker, createNewDeck(name)); }} className="p-4 rounded-[24px] bg-white/10 text-slate-500 font-black text-[10px] uppercase border-2 border-dashed border-slate-500/30">+ Create</button>
            </div>
            <button onClick={() => setShowDeckPicker(null)} className="w-full py-4 bg-slate-200 dark:bg-slate-800 rounded-full font-black text-xs uppercase">Cancel</button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && facts[currentIndex] && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 p-6 backdrop-blur-md" onClick={() => setShowShareModal(false)}>
          <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'} w-full max-w-sm rounded-[48px] p-8 space-y-6 shadow-2xl`} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black tracking-tight text-center">SHARE FACT</h3>
            
            {/* Preview Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[24px] p-6 text-center">
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">{facts[currentIndex].topic}</div>
              <p className="text-white font-bold text-sm leading-relaxed">{facts[currentIndex].content}</p>
              <div className="text-[10px] text-white/40 mt-3 font-bold">FACT FLOW</div>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => handleShare('image')} className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[20px] text-white">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <span className="text-[10px] font-black uppercase">Image</span>
              </button>
              
              <button onClick={() => handleShare('link')} className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-[20px] text-white">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span className="text-[10px] font-black uppercase">Share</span>
              </button>
              
              <button onClick={() => handleShare('copy')} className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-[20px] text-white">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span className="text-[10px] font-black uppercase">Copy</span>
              </button>
            </div>

            <button onClick={() => setShowShareModal(false)} className="w-full py-4 bg-slate-200 dark:bg-slate-800 rounded-full font-black text-xs uppercase">Cancel</button>
          </div>
        </div>
      )}
      
      {/* Feedback View */}
      {view === 'feedback' && (
          <FeedbackBoard 
            theme={theme} 
            feedbacks={feedbacks} 
            onLike={(id) => setFeedbacks(p => p.map(f => f.id === id ? {...f, likes: f.likes + 1} : f))} 
            onSubmit={handleFeedbackSubmit}
          />
      )}

      {/* Saved View */}
      {view === 'saved' && (
         <div className={`fixed inset-0 overflow-y-auto pt-20 px-6 pb-32 ${colors.bg}`}>
            <BackgroundPattern />
            <div className="relative z-10">
              
              {/* Viewing a specific fact from deck */}
              {viewingFactFromDeck ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setViewingFactFromDeck(null)} 
                    className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Back to {user.decks.find(d => d.id === selectedDeck)?.name || 'Deck'}
                  </button>
                  
                  {/* Full fact card */}
                  <div className={`w-full p-8 rounded-[32px] shadow-2xl relative overflow-hidden bg-gradient-to-br ${DARK_GRADIENTS[0]}`}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="inline-block px-6 py-2 bg-black/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                        {viewingFactFromDeck.topic}
                      </div>
                      <h2 className="text-2xl font-black leading-tight tracking-tight text-white drop-shadow-md">
                        {viewingFactFromDeck.content}
                      </h2>
                      <a href={viewingFactFromDeck.sourceUrl} target="_blank" className="flex items-center gap-2 text-[10px] font-black text-white/50 hover:text-white uppercase tracking-widest">
                        Source: {viewingFactFromDeck.sourceName}
                      </a>
                    </div>
                  </div>
                  
                  {/* Other facts in this deck */}
                  <div className="mt-8">
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">More from this deck</h3>
                    <div className="grid gap-3">
                      {facts.filter(f => f.saved && f.deckId === selectedDeck && f.id !== viewingFactFromDeck.id).map(f => (
                        <button 
                          key={f.id} 
                          onClick={() => setViewingFactFromDeck(f)}
                          className={`p-4 rounded-[20px] text-left ${theme === 'light' ? 'bg-white' : 'bg-white/5'} border ${colors.border}`}
                        >
                          <div className="text-[9px] font-black uppercase text-blue-500 mb-1">{f.topic}</div>
                          <div className="font-bold text-sm line-clamp-2">{f.content}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedDeck ? (
                /* Viewing facts in a specific deck */
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedDeck(null)} 
                    className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    All Decks
                  </button>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl ${user.decks.find(d => d.id === selectedDeck)?.color || 'bg-blue-500'} flex items-center justify-center`}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-black">{user.decks.find(d => d.id === selectedDeck)?.name}</h1>
                      <p className="text-sm opacity-50">{facts.filter(f => f.saved && f.deckId === selectedDeck).length} facts saved</p>
                    </div>
                  </div>
                  
                  {/* Facts grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {facts.filter(f => f.saved && f.deckId === selectedDeck).map((f, i) => (
                      <button 
                        key={f.id} 
                        onClick={() => setViewingFactFromDeck(f)}
                        className={`aspect-[4/3] p-4 rounded-[20px] text-left relative overflow-hidden bg-gradient-to-br ${DARK_GRADIENTS[i % DARK_GRADIENTS.length]}`}
                      >
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                        <div className="relative z-10 h-full flex flex-col">
                          <div className="text-[8px] font-black uppercase text-white/60 mb-2">{f.topic}</div>
                          <div className="font-bold text-xs text-white line-clamp-4 flex-1">{f.content}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {facts.filter(f => f.saved && f.deckId === selectedDeck).length === 0 && (
                    <div className="text-center py-16 opacity-50">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 opacity-30"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                      <p className="font-bold">No facts saved yet</p>
                      <p className="text-sm mt-1">Save facts from your feed to this deck</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Deck list view */
                <div className="space-y-6">
                  <h1 className="text-3xl font-black mb-2">Your Decks</h1>
                  <p className="text-sm opacity-50 mb-8">Organize your saved facts into collections</p>
                  
                  <div className="grid gap-4">
                    {user.decks.map(deck => {
                      const deckFacts = facts.filter(f => f.saved && f.deckId === deck.id);
                      return (
                        <button 
                          key={deck.id} 
                          onClick={() => setSelectedDeck(deck.id)}
                          className={`p-5 rounded-[24px] ${theme === 'light' ? 'bg-white shadow-lg' : 'bg-white/5'} border ${colors.border} flex items-center gap-4 active:scale-[0.98] transition-transform`}
                        >
                          <div className={`w-14 h-14 rounded-2xl ${deck.color} flex items-center justify-center shadow-lg`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-black text-lg">{deck.name}</div>
                            <div className="text-xs opacity-50">{deckFacts.length} facts</div>
                          </div>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                      );
                    })}
                    
                    {/* Create new deck button */}
                    <button 
                      onClick={() => {
                        const name = prompt("New deck name:");
                        if (name) {
                          const newDeck = { id: Math.random().toString(36).substr(2, 9), name, color: DECK_COLORS[user.decks.length % DECK_COLORS.length] };
                          setUser(u => ({ ...u, decks: [...u.decks, newDeck] }));
                        }
                      }}
                      className={`p-5 rounded-[24px] border-2 border-dashed ${theme === 'light' ? 'border-slate-300' : 'border-white/20'} flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-black">Create New Deck</div>
                        <div className="text-xs opacity-50">Organize your facts</div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Total saved count */}
                  <div className="text-center pt-8 opacity-40">
                    <p className="text-sm font-bold">{facts.filter(f => f.saved).length} total facts saved</p>
                  </div>
                </div>
              )}
            </div>
         </div>
      )}

      {view === 'profile' && (
        <div className={`fixed inset-0 overflow-y-auto pb-32 ${colors.bg}`}>
           <BackgroundPattern />
           
           {/* Header Banner */}
           <div className="relative h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
             <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
           </div>
           
           {/* Profile Card - Overlapping banner */}
           <div className="relative z-10 px-6 -mt-20">
             <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#111]'} rounded-[32px] p-6 shadow-2xl border ${colors.border}`}>
               
               {/* Avatar + Level Ring */}
               <div className="flex flex-col items-center -mt-16 mb-4">
                 <div className="relative">
                   {/* Level progress ring */}
                   <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="45" fill="none" stroke={theme === 'light' ? '#e5e7eb' : '#333'} strokeWidth="6" />
                     <circle 
                       cx="50" cy="50" r="45" fill="none" 
                       stroke="url(#levelGradient)" strokeWidth="6" strokeLinecap="round"
                       strokeDasharray={`${(user.xp / user.nextLevelXp) * 283} 283`}
                     />
                     <defs>
                       <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                         <stop offset="0%" stopColor="#3B82F6" />
                         <stop offset="100%" stopColor="#8B5CF6" />
                       </linearGradient>
                     </defs>
                   </svg>
                   <img src={user.pfpUrl} className="absolute inset-2 w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#111]" />
                   {/* Edit photo button */}
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#111]"
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                   </button>
                   <input 
                     ref={fileInputRef}
                     type="file" 
                     accept="image/*" 
                     onChange={handlePfpUpload}
                     className="hidden"
                   />
                   {/* Level badge */}
                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                     LVL {user.level}
                   </div>
                 </div>
               </div>
               
               {/* Username + Title */}
               <div className="text-center mb-6">
                 {editingProfile ? (
                   <div className="space-y-3">
                     <input 
                       type="text"
                       value={editName}
                       onChange={(e) => setEditName(e.target.value)}
                       placeholder="Username"
                       className={`w-full text-center text-2xl font-black bg-transparent border-b-2 ${theme === 'light' ? 'border-slate-300' : 'border-white/20'} focus:border-blue-500 outline-none pb-1`}
                     />
                     <input 
                       type="text"
                       value={editBio}
                       onChange={(e) => setEditBio(e.target.value)}
                       placeholder="Bio"
                       className={`w-full text-center text-sm bg-transparent border-b-2 ${theme === 'light' ? 'border-slate-300' : 'border-white/20'} focus:border-blue-500 outline-none pb-1 opacity-70`}
                     />
                     <div className="flex gap-2 justify-center pt-2">
                       <button 
                         onClick={() => setEditingProfile(false)}
                         className="px-4 py-2 bg-white/10 rounded-full text-sm font-bold"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={saveProfile}
                         className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold"
                       >
                         Save
                       </button>
                     </div>
                   </div>
                 ) : (
                   <>
                     <div className="flex items-center justify-center gap-2">
                       <h2 className="text-2xl font-black">{user.username}</h2>
                       <button onClick={startEditProfile} className="p-1 opacity-40 hover:opacity-100">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                       </button>
                     </div>
                     <p className="text-sm opacity-50 mt-1">{user.bio}</p>
                   </>
                 )}
                 <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                   <span className="text-xs font-black text-amber-500 uppercase tracking-wider">
                     {user.level < 5 ? 'Novice Explorer' : user.level < 10 ? 'Fact Hunter' : user.level < 20 ? 'Knowledge Seeker' : user.level < 50 ? 'Wisdom Keeper' : 'Grand Scholar'}
                   </span>
                 </div>
               </div>
               
               {/* Stats Row */}
               <div className="grid grid-cols-3 gap-2 mb-6">
                 <div className="text-center p-3 bg-white/5 rounded-2xl">
                   <div className="text-xl font-black text-blue-500">{user.xp}</div>
                   <div className="text-[9px] font-bold opacity-40 uppercase">XP</div>
                 </div>
                 <div className="text-center p-3 bg-white/5 rounded-2xl">
                   <div className="text-xl font-black text-purple-500">{user.level}</div>
                   <div className="text-[9px] font-bold opacity-40 uppercase">Level</div>
                 </div>
                 <div className="text-center p-3 bg-white/5 rounded-2xl">
                   <div className="text-xl font-black text-orange-500">{user.streak}</div>
                   <div className="text-[9px] font-bold opacity-40 uppercase">Streak</div>
                 </div>
               </div>
             </div>
             
             {/* Settings Sections */}
             <div className="mt-6 space-y-4">
               
               {/* Preferences */}
               <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#111]'} rounded-[24px] p-5 shadow-lg border ${colors.border}`}>
                 <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-4">Preferences</h3>
                 
                 <div className="space-y-1">
                   <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="w-full p-4 rounded-2xl hover:bg-white/5 transition-colors flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                         {theme === 'dark' ? (
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                         ) : (
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                         )}
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-sm">Appearance</div>
                         <div className="text-[10px] opacity-50">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                       </div>
                     </div>
                     <div className={`w-12 h-7 rounded-full ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'} relative transition-colors`}>
                       <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`} />
                     </div>
                   </button>
                   
                   <button onClick={() => soundService.setEnabled(!soundService['enabled'])} className="w-full p-4 rounded-2xl hover:bg-white/5 transition-colors flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-sm">Sound Effects</div>
                         <div className="text-[10px] opacity-50">UI sounds and feedback</div>
                       </div>
                     </div>
                     <div className="w-12 h-7 rounded-full bg-blue-600 relative">
                       <div className="absolute top-1 left-6 w-5 h-5 bg-white rounded-full shadow" />
                     </div>
                   </button>
                   
                   <button onClick={async () => {
                     const permission = await Notification.requestPermission();
                     if (permission === 'granted') {
                       alert('Notifications enabled! We\'ll remind you to learn.');
                     }
                   }} className="w-full p-4 rounded-2xl hover:bg-white/5 transition-colors flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-sm">Notifications</div>
                         <div className="text-[10px] opacity-50">Daily reminders & progress</div>
                       </div>
                     </div>
                     <div className={`w-12 h-7 rounded-full ${Notification.permission === 'granted' ? 'bg-blue-600' : 'bg-slate-300'} relative`}>
                       <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow ${Notification.permission === 'granted' ? 'left-6' : 'left-1'}`} />
                     </div>
                   </button>
                 </div>
               </div>
               
               {/* Support & Info */}
               <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#111]'} rounded-[24px] p-5 shadow-lg border ${colors.border}`}>
                 <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-4">Support</h3>
                 
                 <div className="space-y-1">
                   <button onClick={() => setView('feedback')} className="w-full p-4 rounded-2xl hover:bg-white/5 transition-colors flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-sm">Feedback</div>
                         <div className="text-[10px] opacity-50">Share ideas & report bugs</div>
                       </div>
                     </div>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30"><path d="M9 18l6-6-6-6"/></svg>
                   </button>
                   
                   <button className="w-full p-4 rounded-2xl hover:bg-white/5 transition-colors flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-sm">Help Center</div>
                         <div className="text-[10px] opacity-50">FAQs and tutorials</div>
                       </div>
                     </div>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30"><path d="M9 18l6-6-6-6"/></svg>
                   </button>
                   
                   <button className="w-full p-4 rounded-2xl hover:bg-white/5 transition-colors flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-sm">Rate Us</div>
                         <div className="text-[10px] opacity-50">Love Fact Flow? Let us know!</div>
                       </div>
                     </div>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30"><path d="M9 18l6-6-6-6"/></svg>
                   </button>
                 </div>
               </div>
               
               {/* Account */}
               <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#111]'} rounded-[24px] p-5 shadow-lg border ${colors.border}`}>
                 <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-4">Account</h3>
                 
                 <div className="space-y-1">
                   <div className="p-4 rounded-2xl flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-sm">Email</div>
                         <div className="text-[10px] opacity-50">{user.email || 'Not set'}</div>
                       </div>
                     </div>
                   </div>
                   
                   <button onClick={() => { if(confirm("Log out of Fact Flow?")) { localStorage.clear(); window.location.reload(); }}} className="w-full p-4 rounded-2xl hover:bg-rose-500/10 transition-colors flex justify-between items-center text-rose-500">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-sm">Log Out</div>
                         <div className="text-[10px] opacity-70">Sign out of your account</div>
                       </div>
                     </div>
                   </button>
                 </div>
               </div>
               
               {/* App Info */}
               <div className="text-center py-6 opacity-30">
                 <p className="text-[10px] font-bold uppercase tracking-widest">Fact Flow v1.0.0</p>
                 <p className="text-[9px] mt-1">Made with curiosity</p>
               </div>
             </div>
           </div>
        </div>
      )}

      {levelUpPopup && (
        <>
          <Confetti />
          <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Background Image */}
            <img 
              src="/levelup-bg.png" 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Animated sparkle overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                />
              ))}
            </div>
            
            {/* Level number with rise-up animation */}
            <div 
              className="relative z-10 text-[180px] font-black text-white leading-none"
              style={{ 
                textShadow: '0 0 40px #FFD700, 0 0 80px #FFA500, 0 0 120px #FF8C00',
                animation: 'levelRiseUp 1.5s ease-out forwards'
              }}
            >
              {levelUpPopup}
            </div>
          </div>
          <style>{`
            @keyframes levelRiseUp {
              0% { opacity: 0; transform: translateY(100px) scale(0.5); }
              50% { opacity: 0.8; transform: translateY(-20px) scale(1.1); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </>
      )}

      {user.isAuthenticated && <NavBar theme={theme} currentView={view} onViewChange={setView} />}
    </div>
  );
};

export default App;
