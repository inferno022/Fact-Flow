# 🧠 Fact Flow

**Discover mind-blowing facts with AI-powered personalization**

Fact Flow is an addictive, gamified mobile app that delivers fascinating facts tailored to your interests. Built with React, Capacitor, and powered by Google Gemini AI.

## ✨ Features

- 🤖 **AI-Generated Facts**: Powered by Google Gemini for truly unique, obscure facts
- 🎮 **Gamification**: XP system, levels, streaks, and achievements
- 💰 **Monetization**: AdMob integration with interstitial ads
- 🔔 **Smart Notifications**: Miss-you reminders and streak milestones
- 📱 **Native Mobile**: Built with Capacitor for iOS and Android
- 🎯 **Personalization**: Never see the same fact twice
- 🔒 **Secure**: Comprehensive security hardening
- 📊 **Analytics**: User engagement tracking

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Mobile**: Capacitor 6, Ionic Framework
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI**: Google Gemini 2.0 Flash
- **Monetization**: Google AdMob
- **Build**: Vite, Ionic Appflow

## 📱 Screenshots

*Add your app screenshots here*

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Android Studio (for Android builds)
- Supabase account
- Google Gemini API key
- AdMob account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fact-flow.git
   cd fact-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run on mobile**
   ```bash
   npm run build
   npx cap sync android
   npx cap run android
   ```

## 🔧 Configuration

### Environment Variables
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Supabase Setup
Run the SQL files in this order:
1. `supabase-setup.sql`
2. `create-user-seen-facts.sql`
3. `add-shared-facts-table.sql`
4. `create-notification-tables.sql`

### AdMob Configuration
- App ID: `ca-app-pub-2213791889367670~9079733848`
- Interstitial Unit: `ca-app-pub-2213791889367670/6718306146`

## 📦 Build & Deploy

### Ionic Appflow (Recommended)
1. Connect repo to [Ionic Appflow](https://ionic.io)
2. Set environment variables
3. Create Android build
4. Download signed AAB for Play Store

### Manual Build
```bash
npm run build
npx cap sync android
npx cap open android
# Use Android Studio to generate signed APK/AAB
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🏗️ Architecture

```
src/
├── components/          # React components
├── services/           # API services, caching, security
├── types.ts           # TypeScript definitions
├── constants.tsx      # App constants
└── App.tsx           # Main app component

android/               # Capacitor Android project
public/               # Static assets
supabase/            # Database schemas
```

## 🔐 Security Features

- Input sanitization and validation
- Rate limiting for API calls
- Content Security Policy headers
- Session fingerprinting
- Secure random ID generation
- XSS protection

## 📊 Analytics & Monetization

- **AdMob Integration**: Interstitial ads every 8 facts
- **User Engagement**: XP, levels, streaks tracking
- **Retention**: Smart push notifications
- **Personalization**: AI-driven content curation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for fact generation
- Supabase for backend infrastructure
- Ionic team for mobile framework
- React community for amazing ecosystem

## 📞 Support

- **Email**: app.factflow@gmail.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/fact-flow/issues)
- **Privacy Policy**: [Privacy Policy](./public/privacy-policy.html)

---

**Made with ❤️ for curious minds everywhere**