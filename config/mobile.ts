// Mobile-specific configuration and utilities

// Check if running on mobile device
export const isMobile = (): boolean => {
  return typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
};

// Check if running in Capacitor (native app)
export const isNative = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
};

// Check if running in development mode
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

// Check if running in production mode
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

// Get platform information
export const getPlatform = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  if (isNative()) {
    // Check if Android or iOS
    if (/Android/i.test(navigator.userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'ios';
    return 'native';
  }
  
  return 'web';
};

// Mobile-specific viewport configuration
export const configureViewport = (): void => {
  if (typeof window === 'undefined') return;
  
  // Prevent zoom on input focus (mobile)
  if (isMobile()) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no'
      );
    }
  }
  
  // Set CSS custom properties for safe areas
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
};

// Handle mobile-specific touch events
export const configureTouchEvents = (): void => {
  if (typeof window === 'undefined') return;
  
  // Prevent pull-to-refresh on mobile
  document.body.style.overscrollBehavior = 'none';
  
  // Prevent context menu on long press
  document.addEventListener('contextmenu', (e) => {
    if (isMobile()) {
      e.preventDefault();
    }
  });
  
  // Prevent text selection on mobile
  if (isMobile()) {
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
  }
};

// Debug information for mobile testing
export const getMobileDebugInfo = () => {
  if (typeof window === 'undefined') return {};
  
  return {
    userAgent: navigator.userAgent,
    platform: getPlatform(),
    isMobile: isMobile(),
    isNative: isNative(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    capacitor: isNative() ? (window as any).Capacitor : null,
  };
};

// Initialize mobile configuration
export const initMobileConfig = (): void => {
  console.log('Mobile Debug Info:', getMobileDebugInfo());
  configureViewport();
  configureTouchEvents();
};