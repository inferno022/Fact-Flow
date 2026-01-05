// Ad Configuration for Fact Flow
// Uses AdMob for native Android, AdSense fallback for web

export const AD_CONFIG = {
  // AdMob (Native Android)
  admob: {
    appId: 'ca-app-pub-2213791889367670~9079733848',
    interstitialAdId: 'ca-app-pub-2213791889367670/6718306146',
  },
  
  // AdSense (Web fallback)
  adsense: {
    publisherId: 'ca-pub-2213791889367670',
    feedAdSlot: '6718306146',
  },
  
  // How often to show ads (every N facts)
  adFrequency: 8,
  
  // Show first ad after this many facts
  firstAdAfter: 8,
};

/*
SETUP COMPLETE:

AdMob (Android Native):
- App ID: ca-app-pub-2213791889367670~9079733848
- Interstitial Ad Unit: ca-app-pub-2213791889367670/6718306146
- Configured in AndroidManifest.xml
- Uses @capacitor-community/admob plugin

AdSense (Web):
- Publisher ID: ca-pub-2213791889367670
- Configured in index.html and AdBanner.tsx

Ad Behavior:
- Interstitial ads show every 8 facts on native
- Web shows inline ad cards in feed
*/
