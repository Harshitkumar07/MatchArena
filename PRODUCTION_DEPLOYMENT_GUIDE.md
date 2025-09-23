# 🚀 MatchArena Production Deployment Guide

## Overview
This guide will help you deploy MatchArena to production with real live sports data from your Cricket API (cricketdata.org) and API-Football (20+ sports).

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)  
- [ ] API Keys obtained:
  - [ ] Cricket API key from cricketdata.org
  - [ ] API-Football key from dashboard.api-football.com
- [ ] Firebase project created
- [ ] Git repository access

## 🔥 Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
```bash
# Login to Firebase
firebase login

# Create new project (or use existing)
firebase projects:create matcharena-prod
firebase use matcharena-prod
```

### 1.2 Enable Required Services
In Firebase Console (https://console.firebase.google.com):

1. **Authentication**
   - Enable Email/Password provider
   - Enable Google OAuth provider  
   - Add your domain to authorized domains

2. **Realtime Database**
   - Create database in your preferred region
   - Start in locked mode (we'll deploy rules later)

3. **Hosting**
   - Initialize hosting

4. **Cloud Functions**
   - Upgrade to Blaze plan (required for external API calls)

## 🔐 Step 2: Secure API Configuration

### 2.1 Configure API Keys in Firebase Functions
```bash
# Navigate to your project directory
cd path/to/MatchArena

# Set Cricket API key (from cricketdata.org)
firebase functions:config:set cricket.api_key="YOUR_CRICKET_API_KEY"

# Set Football API key (from API-Football dashboard) 
firebase functions:config:set football.api_key="YOUR_API_FOOTBALL_KEY"

# Set admin configuration
firebase functions:config:set admin.allowed_emails="your-admin@email.com"

# Set security configuration
firebase functions:config:set security.allowed_origins="https://your-domain.com,https://your-app.web.app"

# Set app environment
firebase functions:config:set app.environment="production"
```

### 2.2 Run Configuration Script
```bash
# Run the automated setup script
node scripts/setup-firebase-config.js
```

## 🛠️ Step 3: Install Dependencies

```bash
# Install main dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

## 🔒 Step 4: Deploy Security Rules

```bash
# Deploy database security rules
firebase deploy --only database

# Verify rules are applied in Firebase Console
```

## ⚡ Step 5: Deploy Firebase Functions

### 5.1 Build and Deploy Functions
```bash
# Deploy functions
firebase deploy --only functions

# Monitor deployment
firebase functions:log
```

### 5.2 Test Functions
```bash
# Test health endpoint
curl https://us-central1-your-project.cloudfunctions.net/sportsApi/health

# Test cricket API
curl https://us-central1-your-project.cloudfunctions.net/sportsApi/cricket/matches/live

# Test multi-sport API  
curl https://us-central1-your-project.cloudfunctions.net/sportsApi/sports/list
```

## 🏗️ Step 6: Build & Deploy Frontend

### 6.1 Configure Environment Variables
Create `.env.production`:
```env
REACT_APP_ENV=production
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_ANALYTICS_ENABLED=true
REACT_APP_ENABLE_PWA=true
```

### 6.2 Build and Deploy
```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy everything at once
firebase deploy
```

## 🧪 Step 7: Production Testing

### 7.1 Verify API Endpoints
```bash
# Check all endpoints are working
curl https://your-app.web.app

# Test API health
curl https://us-central1-your-project.cloudfunctions.net/sportsApi/health

# Test live matches
curl https://us-central1-your-project.cloudfunctions.net/sportsApi/matches/live
```

### 7.2 Test Frontend Features
- [ ] User registration/login works
- [ ] Live cricket scores display
- [ ] Multi-sport fixtures load
- [ ] Community features work
- [ ] Real-time updates function
- [ ] PWA installs correctly

## 📊 Step 8: Monitoring & Analytics

### 8.1 Enable Monitoring
```bash
# Deploy with performance monitoring
firebase deploy

# Check Firebase Console > Performance
# Check Firebase Console > Functions > Logs
```

### 8.2 Set Up Alerts
In Firebase Console:
1. Go to Alerting
2. Set up alerts for:
   - Function errors
   - High latency  
   - API quota usage
   - Database usage

## 🔄 Step 9: Automated Deployments (Optional)

### 9.1 GitHub Actions Setup
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

### 9.2 Configure Secrets
In GitHub repository settings:
- Add `FIREBASE_SERVICE_ACCOUNT` secret
- Get service account from Firebase Console > Project Settings > Service Accounts

## 🏃‍♂️ Step 10: Performance Optimization

### 10.1 Enable Caching
```bash
# Functions are already optimized with caching
# Frontend uses Service Worker for caching
```

### 10.2 CDN Setup (Optional)
```bash
# Firebase Hosting includes global CDN
# No additional setup required
```

## 🚨 Step 11: Production Checklist

### Security
- [ ] API keys are in Functions config (not client-side)
- [ ] Database rules deployed and tested
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Authentication working

### Performance  
- [ ] Functions respond within 5 seconds
- [ ] Frontend loads within 3 seconds
- [ ] Live data updates every 2 minutes
- [ ] Caching working properly

### Functionality
- [ ] All 20+ sports loading correctly
- [ ] Cricket live scores updating
- [ ] Community features working
- [ ] User authentication functional
- [ ] Real-time notifications working

### Monitoring
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Usage alerts configured
- [ ] Backup strategy in place

## 🆘 Troubleshooting

### Common Issues

#### Function Deployment Fails
```bash
# Check Node version
node --version  # Should be 18+

# Check Firebase CLI version
firebase --version

# Re-login if needed
firebase logout
firebase login
```

#### API Keys Not Working
```bash
# Verify configuration
firebase functions:config:get

# Re-set if needed
firebase functions:config:set cricket.api_key="your-key"
firebase deploy --only functions
```

#### CORS Errors
- Verify origins in Functions config
- Check Firebase Hosting domains
- Test from allowed domains only

#### Database Permission Denied
- Check authentication state
- Verify database rules
- Test with authenticated user

## 📈 Step 12: Scaling & Maintenance

### 12.1 Monitor Usage
- Track API call counts
- Monitor database usage  
- Watch function execution time
- Check hosting bandwidth

### 12.2 Rate Limiting
Functions include built-in rate limiting:
- Live data: Updates every 2 minutes
- User requests: Cached responses
- API calls: Optimized scheduling

### 12.3 Backup Strategy
```bash
# Export database regularly
firebase database:get / > backup-$(date +%Y%m%d).json

# Store backups securely
# Set up automated backup script
```

## 🎉 Success!

Your MatchArena is now live with:
- ✅ Real cricket live scores from cricketdata.org
- ✅ 20+ sports from API-Football
- ✅ Secure Firebase backend
- ✅ Production-ready performance
- ✅ Real-time community features

## 🔗 Important URLs

After deployment, save these URLs:
- **Website**: https://your-project.web.app
- **API Base**: https://us-central1-your-project.cloudfunctions.net/sportsApi
- **Firebase Console**: https://console.firebase.google.com/project/your-project

## 📞 Support

For deployment issues:
1. Check Firebase Console logs
2. Review function execution logs  
3. Test API endpoints directly
4. Verify environment configuration

---

**Built with ❤️ for sports fans worldwide!**
