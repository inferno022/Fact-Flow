import React, { useEffect, useRef, useState } from 'react';

const ADSENSE_PUBLISHER_ID = 'ca-pub-2213791889367670';

// Check if running on native (Capacitor)
const isNative = typeof (window as any).Capacitor !== 'undefined';

interface AdBannerProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidth?: boolean;
  className?: string;
}

// Google AdSense Banner Component
export const AdBanner: React.FC<AdBannerProps> = ({ 
  adSlot, 
  adFormat = 'auto', 
  fullWidth = true,
  className = '' 
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    if (isAdLoaded.current) return;
    
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
        isAdLoaded.current = true;
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div ref={adRef} className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'block',
          width: fullWidth ? '100%' : 'auto',
          height: adFormat === 'rectangle' ? '250px' : 'auto',
        }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidth ? 'true' : 'false'}
      />
    </div>
  );
};

// Full-screen ad card for feed - shows placeholder on web/localhost, real ads on production
export const FeedAd: React.FC<{ adSlot: string }> = ({ adSlot }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  useEffect(() => {
    if (isNative) return; // Native uses interstitial ads
    
    // Check if we're on localhost or production
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      setShowPlaceholder(true);
      return;
    }
    
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
        isAdLoaded.current = true;
        
        // Check if ad loaded after delay
        setTimeout(() => {
          if (adRef.current) {
            const adElement = adRef.current.querySelector('.adsbygoogle');
            if (adElement && adElement.innerHTML.trim() === '') {
              setShowPlaceholder(true);
            }
          }
        }, 3000);
      } else {
        setShowPlaceholder(true);
      }
    } catch (e) {
      console.error('AdSense error:', e);
      setShowPlaceholder(true);
    }
  }, []);

  // On native, this component won't show (interstitials are used instead)
  if (isNative) return null;

  return (
    <div 
      ref={adRef}
      className="w-full max-w-sm h-[55%] rounded-[48px] shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center"
      style={{ marginBottom: '15%' }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
        backgroundSize: '20px 20px' 
      }} />
      
      {/* Sponsored label */}
      <div className="absolute top-6 left-0 right-0 text-center">
        <span className="px-4 py-1 bg-white/10 rounded-full text-[10px] font-black text-white/50 uppercase tracking-widest">
          Sponsored
        </span>
      </div>
      
      {/* Ad container or placeholder */}
      <div className="relative z-10 w-full px-6 flex-1 flex items-center justify-center">
        {showPlaceholder ? (
          // Enhanced placeholder for development/fallback
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
            </div>
            <p className="text-white/60 text-lg font-bold mb-2">Ad Space</p>
            <p className="text-white/30 text-sm">Real ads show on published app</p>
            <div className="mt-4 px-4 py-2 bg-white/5 rounded-full">
              <p className="text-white/20 text-xs">AdMob ID: {adSlot}</p>
            </div>
          </div>
        ) : (
          <ins
            className="adsbygoogle"
            style={{ 
              display: 'block',
              width: '100%',
              minHeight: '250px',
              maxHeight: '400px',
            }}
            data-ad-client={ADSENSE_PUBLISHER_ID}
            data-ad-slot={adSlot}
            data-ad-format="fluid"
            data-full-width-responsive="true"
          />
        )}
      </div>
      
      {/* Swipe hint */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
          Swipe to continue
        </p>
      </div>
    </div>
  );
};

export default AdBanner;
