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

// Full-screen ad card for feed - shows placeholder on web/localhost
export const FeedAd: React.FC<{ adSlot: string }> = ({ adSlot }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef(false);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    if (isAdLoaded.current || isNative) return;
    
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        (window as any).adsbygoogle.push({});
        isAdLoaded.current = true;
      } else {
        // No AdSense available (localhost/dev)
        setAdFailed(true);
      }
    } catch (e) {
      console.error('AdSense error:', e);
      setAdFailed(true);
    }
    
    // Check if ad loaded after a delay
    setTimeout(() => {
      if (!isAdLoaded.current) setAdFailed(true);
    }, 2000);
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
        {adFailed ? (
          // Placeholder when ads can't load (localhost/dev)
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
            </div>
            <p className="text-white/40 text-sm font-bold">Ad Space</p>
            <p className="text-white/20 text-[10px] mt-1">Ads appear on published app</p>
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
