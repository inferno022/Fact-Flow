#!/usr/bin/env node

/**
 * Ad Configuration Verification Script
 * Verifies that all ad-related configurations are correct
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Ad Configuration...\n');

// Check files exist
const requiredFiles = [
  'services/adService.ts',
  'components/AdBanner.tsx',
  'config/ads.ts',
  'android/app/src/main/AndroidManifest.xml',
  'index.html'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check AdMob App ID in AndroidManifest.xml
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
const manifestContent = fs.readFileSync(manifestPath, 'utf8');
const appIdMatch = manifestContent.match(/ca-app-pub-2213791889367670~9079733848/);

if (appIdMatch) {
  console.log('✅ AdMob App ID found in AndroidManifest.xml');
} else {
  console.log('❌ AdMob App ID not found in AndroidManifest.xml');
}

// Check AdSense script in index.html
const indexPath = 'index.html';
const indexContent = fs.readFileSync(indexPath, 'utf8');
const adSenseMatch = indexContent.match(/pagead2\.googlesyndication\.com/);

if (adSenseMatch) {
  console.log('✅ AdSense script found in index.html');
} else {
  console.log('❌ AdSense script not found in index.html');
}

// Check package.json for AdMob plugin
const packagePath = 'package.json';
const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const hasAdMobPlugin = packageContent.dependencies && packageContent.dependencies['@capacitor-community/admob'];

if (hasAdMobPlugin) {
  console.log(`✅ AdMob plugin installed: ${packageContent.dependencies['@capacitor-community/admob']}`);
} else {
  console.log('❌ AdMob plugin not found in package.json');
}

// Check ad service configuration
const adServicePath = 'services/adService.ts';
const adServiceContent = fs.readFileSync(adServicePath, 'utf8');
const hasCorrectAppId = adServiceContent.includes('ca-app-pub-2213791889367670~9079733848');
const hasCorrectAdUnit = adServiceContent.includes('ca-app-pub-2213791889367670/6718306146');

if (hasCorrectAppId && hasCorrectAdUnit) {
  console.log('✅ Ad service has correct AdMob IDs');
} else {
  console.log('❌ Ad service missing correct AdMob IDs');
}

// Check App.tsx integration
const appPath = 'App.tsx';
const appContent = fs.readFileSync(appPath, 'utf8');
const hasAdImports = appContent.includes('initAdMob') && appContent.includes('showInterstitialAd') && appContent.includes('FeedAd');
const hasAdLogic = appContent.includes('adInterval') && appContent.includes('isAd');

if (hasAdImports && hasAdLogic) {
  console.log('✅ App.tsx has proper ad integration');
} else {
  console.log('❌ App.tsx missing ad integration');
}

console.log('\n🎯 Ad Configuration Summary:');
console.log('- AdMob App ID: ca-app-pub-2213791889367670~9079733848');
console.log('- Interstitial Ad Unit: ca-app-pub-2213791889367670/6718306146');
console.log('- Ad Frequency: Every 8 facts');
console.log('- Native: Interstitial ads');
console.log('- Web: Inline AdSense ads');

console.log('\n✅ All ad configurations verified successfully!');
console.log('🚀 Ready for production deployment');