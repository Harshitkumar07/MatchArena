# MatchArena Setup & Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Firebase CLI: `npm install -g firebase-tools`
- Git

### Step 1: Install Dependencies

```bash
# Install main dependencies
npm install

# If you see any warnings about missing dependencies, run:
npm install react-router-dom @tanstack/react-query axios firebase react-hook-form zod @hookform/resolvers dompurify react-hot-toast react-helmet-async date-fns @tanstack/react-virtual classnames workbox-window

# Install dev dependencies
npm install -D eslint prettier eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-import eslint-plugin-jsx-a11y eslint-config-prettier cross-env @firebase/rules-unit-testing msw playwright firebase-tools husky

# Optional: Install Tailwind plugins
npm install -D @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio
```

### Step 2: Firebase Setup

#### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name it "matcharena" (or your preferred name)
4. Enable Google Analytics (optional)
5. Wait for project creation

#### 2.2 Enable Services

In Firebase Console:

1. **Authentication**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google provider
   - Add your domain to Authorized domains

2. **Realtime Database**
   - Go to Realtime Database
   - Click "Create Database"
   - Choose location closest to your users
   - Start in test mode (we'll apply security rules later)

3. **Hosting**
   - Go to Hosting
   - Click "Get Started"
   - Note the hosting URL

#### 2.3 Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" icon to add a web app
4. Register app with nickname "MatchArena Web"
5. Copy the configuration

### Step 3: Local Environment Setup

1. **Copy environment template:**
```bash
cp .env.example .env
```

2. **Edit .env file with your Firebase config:**
```env
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 4: Initialize Firebase Locally

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Realtime Database
# - Functions (TypeScript)
# - Hosting
# - Emulators
```

When prompted:
- Use existing firebase.json and firebase.rules.json
- Set public directory as "build"
- Configure as single-page app: Yes
- Don't overwrite index.html

### Step 5: Setup Cloud Functions

```bash
cd functions
npm install
cd ..
```

#### Configure Functions Environment:

```bash
# Set CricAPI key (get from https://cricapi.com)
firebase functions:config:set cric.api_key="YOUR_CRICAPI_KEY"

# Set admin emails
firebase functions:config:set admin.allowed_emails="admin@example.com"

# Optional: Discord webhook
firebase functions:config:set discord.webhook="YOUR_DISCORD_WEBHOOK"

# Set security origins
firebase functions:config:set security.allowed_origins="http://localhost:3000,https://your-domain.com"
```

### Step 6: Deploy Security Rules

```bash
# Deploy database rules
firebase deploy --only database
```

### Step 7: Run Development Server

```bash
# Terminal 1: Start Firebase emulators
npm run emulators

# Terminal 2: Start React app
npm start
```

Visit http://localhost:3000

## 📦 Production Deployment

### Step 1: Build the Application

```bash
npm run build
```

### Step 2: Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only database
```

### Step 3: Set Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow verification steps
4. Update DNS records

## 🔐 Security Checklist

- [ ] Environment variables are set correctly
- [ ] Firebase security rules are deployed
- [ ] API keys are in Cloud Functions config, not client code
- [ ] CORS is configured properly
- [ ] Admin emails are set in Functions config
- [ ] CSP headers are appropriate

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run linting
npm run lint

# Format code
npm run format
```

## 🐛 Troubleshooting

### Issue: Firebase not configured
**Solution:** Ensure .env file exists with correct values

### Issue: Emulators not starting
**Solution:** 
```bash
firebase emulators:start --import=./emulator-data --export-on-exit
```

### Issue: Functions deployment fails
**Solution:** Check Node version (must be 18 or 20)

### Issue: Authentication not working
**Solution:** 
1. Check Firebase Console → Authentication is enabled
2. Verify authorized domains include localhost and production URL

### Issue: Database rules rejection
**Solution:** Check user authentication state and role

## 📊 Monitoring

### Firebase Console
- Monitor usage in Firebase Console
- Check Cloud Functions logs
- Review Realtime Database usage

### Error Tracking (Optional)
1. Sign up for Sentry
2. Add Sentry DSN to .env
3. Errors will be automatically tracked

## 🔄 Updates and Maintenance

### Update Dependencies
```bash
npm update
npm audit fix
```

### Backup Database
```bash
# Export data
firebase database:get / > backup.json

# Import data
firebase database:set / backup.json
```

## 📝 Additional Notes

### API Keys
- CricAPI: Get from https://cricapi.com/signup
- Football API: Configure your provider
- Kabaddi API: Configure your provider

### Rate Limits
- CricAPI: 100 requests/day (free tier)
- Consider caching in Cloud Functions
- Implement rate limiting for users

### Performance
- Enable Firebase Performance Monitoring
- Use Lighthouse for audits
- Monitor bundle size

## 🤝 Support

For issues:
1. Check documentation
2. Review error logs in Firebase Console
3. Create issue on GitHub
4. Contact support@matcharena.com

## 📄 License

MIT License - See LICENSE file for details
