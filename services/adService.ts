import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdmobConsentStatus, InterstitialAdPluginEvents } from '@capacitor-community/admob';

// AdMob Configuration
const ADMOB_CONFIG = {
  appId: 'ca-app-pub-2213791889367670~9079733848',
  interstitialAdId: 'ca-app-pub-2213791889367670/6718306146',
  // Test IDs for development (use these during testing)
  testInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
};

// Use test ads in development
const isProduction = import.meta.env.PROD;
const getAdUnitId = () => isProduction ? ADMOB_CONFIG.interstitialAdId : ADMOB_CONFIG.testInterstitialId;

let isInitialized = false;
let adLoadedCount = 0;

export const initAdMob = async (): Promise<void> => {
  if (isInitialized) return;
  
  try {
    await AdMob.initialize({
      initializeForTesting: !isProduction,
    });
    isInitialized = true;
    console.log('AdMob initialized');
    
    // Preload first interstitial
    await prepareInterstitial();
  } catch (error) {
    console.error('AdMob init error:', error);
  }
};

export const prepareInterstitial = async (): Promise<void> => {
  try {
    await AdMob.prepareInterstitial({
      adId: getAdUnitId(),
      isTesting: !isProduction,
    });
    console.log('Interstitial ad prepared');
  } catch (error) {
    console.error('Failed to prepare interstitial:', error);
  }
};

export const showInterstitialAd = async (): Promise<boolean> => {
  try {
    await AdMob.showInterstitial();
    adLoadedCount++;
    
    // Prepare next ad
    setTimeout(() => prepareInterstitial(), 1000);
    
    return true;
  } catch (error) {
    console.error('Failed to show interstitial:', error);
    // Try to prepare another ad
    prepareInterstitial();
    return false;
  }
};

// Show ad every N facts (returns true if ad should be shown)
export const shouldShowAd = (factIndex: number, interval: number = 8): boolean => {
  return factIndex > 0 && factIndex % interval === 0;
};

// Track ad impressions
export const getAdCount = (): number => adLoadedCount;
