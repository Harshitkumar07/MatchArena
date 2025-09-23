# API Setup Guide for MatchArena

## 🔑 API Keys Required

### 1. Cricket API (CricAPI)
- **URL**: https://cricapi.com/
- **Free Tier**: 100 requests/day
- **Setup Steps**:
  1. Register at cricapi.com
  2. Get your API key from dashboard
  3. Add to Firebase Functions config: `firebase functions:config:set cric.api_key="YOUR_KEY"`

### 2. Football API (API-Sports)
- **URL**: https://api-sports.io/
- **Free Tier**: 100 requests/day
- **Setup Steps**:
  1. Register at api-sports.io
  2. Subscribe to Football API
  3. Get API key from dashboard
  4. Add to Firebase Functions config: `firebase functions:config:set football.api_key="YOUR_KEY"`

### 3. Multi-Sport APIs (Optional)
- **TheSportsDB**: Free public API (no key needed)
- **RapidAPI**: Multiple sports APIs available
  - Register at rapidapi.com
  - Subscribe to Basketball/Tennis APIs
  - Add to Firebase config: `firebase functions:config:set sports.api_key="YOUR_RAPIDAPI_KEY"`

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Follow the setup wizard
4. Enable these services:
   - **Realtime Database**
   - **Hosting**
   - **Functions**
   - **Authentication** (optional)

### 2. Get Configuration
1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Click "Web app" icon to create web app
4. Copy the config object values to your `.env.local`

### 3. Set up Database Rules
```json
{
  "rules": {
    "sports": {
      ".read": true,
      ".write": "auth != null"
    },
    "live_scores": {
      ".read": true,
      ".write": "auth != null"
    },
    "asian_leagues": {
      ".read": true,
      ".write": false
    }
  }
}
```

### 4. Deploy Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

## 🧪 Test Configuration

After setup, run:
```bash
npm run health:check
```

Should show:
- ✅ Firebase services connected
- ✅ API endpoints accessible  
- ✅ Database connectivity working

## 🚀 Development Workflow

1. **Start development server**:
   ```bash
   npm start
   ```

2. **Run Firebase emulators** (optional):
   ```bash
   npm run emulators
   ```

3. **Test API integration**:
   ```bash
   npm run test:integration
   ```

## 🔧 Troubleshooting

### Common Issues:

**Firebase Project ID Missing:**
- Check your `.env.local` has `REACT_APP_FIREBASE_PROJECT_ID`
- Make sure Firebase project is created and active

**API 401 Errors:**
- Verify API keys are set in Firebase Functions config
- Check API key quotas haven't been exceeded

**CORS Issues:**
- APIs should be called from Firebase Functions, not directly from frontend
- Check Functions are deployed: `firebase functions:list`

**Database Rules:**
- Make sure Realtime Database rules allow read access
- For development, you can temporarily set `.read: true`

## 📱 Asian Sports Focus

The system prioritizes these leagues:
- **Cricket**: IPL, Asia Cup, Ranji Trophy
- **Football**: ISL, AFC Champions League, J-League, K League
- **Basketball**: CBA, B.League, KBL, PBA
- **Badminton**: BWF World Tour events in Asia
- **Tennis**: ATP/WTA events in Asia-Pacific

## 🎯 Quick Start Checklist

- [ ] Firebase project created
- [ ] `.env.local` configured with Firebase settings
- [ ] Cricket API key obtained and configured
- [ ] Football API key obtained and configured  
- [ ] Firebase Functions deployed
- [ ] Database rules configured
- [ ] Health check passes
- [ ] Development server starts successfully

## 📞 Support

If you encounter issues:
1. Check the health check report: `./health-report.json`
2. Review Firebase console for errors
3. Check API quota usage in respective dashboards
4. Run `npm run test:integration` for detailed API testing
