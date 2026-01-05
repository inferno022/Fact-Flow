# Fact Flow - Deployment Guide

## Ionic Appflow Setup

### 1. Prerequisites
- Ionic account at [ionic.io](https://ionic.io)
- GitHub repository connected to Ionic Appflow
- Environment variables configured

### 2. Environment Variables (Set in Ionic Appflow)
```
VITE_GEMINI_API_KEY=AIzaSyA3vIbOyyHkkPD0hN-h2oaDyJMqmf2HakM
```

### 3. Build Configuration
- **Build Type**: Android
- **Target**: Release
- **Build Stack**: Latest
- **Environment**: Production

### 4. Signing Certificate
Upload your Android keystore in Ionic Appflow:
- Go to Settings → Certificates
- Upload your .jks keystore file
- Enter keystore password and alias

### 5. Build Commands
The app uses standard Ionic build process:
```bash
npm ci
npm run build
npx cap sync android
```

## Manual Build (Alternative)

### Prerequisites
- Node.js 18+
- Java 17 (not Java 21)
- Android SDK

### Commands
```bash
# Install dependencies
npm install

# Build web app
npm run build

# Sync with Capacitor
npx cap sync android

# Build APK (requires Android Studio)
npx cap open android
```

## App Configuration

### AdMob Integration
- App ID: `ca-app-pub-2213791889367670~9079733848`
- Interstitial Ad Unit: `ca-app-pub-2213791889367670/6718306146`

### Supabase Backend
- URL: `https://libcgvamzfkuhfexxfgz.supabase.co`
- Database tables: `users`, `cached_facts`, `shared_facts`, `user_seen_facts`

### Features Included
- ✅ AI-generated facts with Gemini
- ✅ User authentication
- ✅ XP/Level/Streak system
- ✅ AdMob monetization
- ✅ Push notifications
- ✅ Fact sharing system
- ✅ No duplicate facts per user
- ✅ Security hardening

## Play Store Submission

### Required Assets
1. **App Icon**: `logo.png` (already configured)
2. **Screenshots**: Phone + Tablet screenshots
3. **Feature Graphic**: 1024x500px
4. **Privacy Policy**: Host `public/privacy-policy.html`

### App Details
- **Package Name**: `io.factflow.app`
- **Version**: 1.0.0
- **Category**: Education
- **Content Rating**: Everyone

### Upload Process
1. Build signed AAB using Ionic Appflow
2. Upload to Google Play Console
3. Fill store listing details
4. Submit for review

## Troubleshooting

### Common Issues
1. **Gradle build fails**: Update compileSdk to 35 (already done)
2. **Missing gradlew**: Ensure gradle wrapper is committed to git
3. **API key errors**: Check environment variables in Ionic Appflow
4. **AdMob not showing**: Ads only work on real devices, not emulator

### Support
- Email: app.factflow@gmail.com
- GitHub: https://github.com/inferno022/Fact-Flow