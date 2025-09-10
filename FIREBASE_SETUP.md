# Firebase Setup Guide for MatchArena

This guide will help you set up Firebase for the MatchArena application.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google account

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `matcharena` (or your preferred name)
4. Disable Google Analytics for now (you can enable it later)
5. Click "Create project"

## Step 2: Enable Services

In the Firebase Console for your project:

### Enable Authentication
1. Go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the following sign-in methods:
   - Email/Password
   - Google

### Enable Realtime Database
1. Go to "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Choose your region (preferably closest to your users)
4. Start in "Test mode" for now (we'll apply security rules later)
5. Click "Enable"

### Enable Hosting
1. Go to "Hosting" in the left sidebar
2. Click "Get started"
3. Follow the setup flow (we'll configure it locally)

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps" section
3. Click the "</>" (Web) icon to add a web app
4. Register app with nickname "MatchArena Web"
5. Copy the Firebase configuration object

## Step 4: Configure Environment Variables

1. Open `.env` file in your project root
2. Fill in the values from your Firebase configuration:

```env
REACT_APP_ENV=development
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
REACT_APP_ANALYTICS_ENABLED=false
REACT_APP_SENTRY_DSN=
```

## Step 5: Initialize Firebase Locally

Run the following commands in your project root:

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

When prompted, select:
- **Features to set up:**
  - ✅ Realtime Database
  - ✅ Functions
  - ✅ Hosting
  - ✅ Emulators

- **Database Rules:**
  - Use existing file: `firebase.rules.json`

- **Functions:**
  - Language: TypeScript
  - ESLint: Yes
  - Install dependencies: Yes

- **Hosting:**
  - Public directory: `build`
  - Single-page app: Yes
  - Automatic builds with GitHub: No (for now)
  - Overwrite index.html: No

- **Emulators:**
  - ✅ Authentication Emulator
  - ✅ Functions Emulator
  - ✅ Database Emulator
  - ✅ Hosting Emulator
  - Use default ports or customize as needed
  - Enable Emulator UI: Yes
  - Download emulators: Yes

## Step 6: Update Firebase Configuration Files

### Update `.firebaserc`
```json
{
  "projects": {
    "default": "your-project-id",
    "dev": "your-project-id",
    "staging": "your-project-id-staging",
    "production": "your-project-id"
  }
}
```

### Verify `firebase.json`
Ensure it matches the configuration in the project.

## Step 7: Deploy Security Rules

```bash
# Deploy database rules
firebase deploy --only database:rules

# Or deploy everything
firebase deploy
```

## Step 8: Set Up Cloud Functions Configuration

For Cloud Functions to work with external APIs, set configuration:

```bash
# Set CricAPI key (get from https://cricapi.com/)
firebase functions:config:set cric.api_key="YOUR_CRICAPI_KEY"

# Set admin emails (comma-separated)
firebase functions:config:set admin.allowed_emails="admin@matcharena.com,your-email@example.com"

# Optional: Discord webhook for notifications
firebase functions:config:set discord.webhook="YOUR_DISCORD_WEBHOOK_URL"

# Set allowed origins for CORS
firebase functions:config:set security.allowed_origins="http://localhost:3000,https://your-domain.com"
```

## Step 9: Initialize Cloud Functions

```bash
cd functions
npm install
cd ..
```

## Step 10: Start Development Environment

```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start

# Terminal 2: Seed the database (after emulators are running)
npm run seed

# Terminal 3: Start React development server
npm start
```

## Step 11: Test the Setup

1. Open http://localhost:3000 in your browser
2. The app should load without errors
3. Check Firebase Emulator UI at http://localhost:4000
4. Try creating an account with the test credentials:
   - Admin: admin@matcharena.com / admin123456
   - User: user1@matcharena.com / user123456

## Troubleshooting

### Issue: Firebase command not found
**Solution:** Install Firebase tools globally
```bash
npm install -g firebase-tools
```

### Issue: Emulators won't start
**Solution:** Check if ports are already in use or run with different ports:
```bash
firebase emulators:start --only database,auth --database-port=9001 --auth-port=9098
```

### Issue: CORS errors in browser
**Solution:** Make sure your development URL is in the allowed origins:
```bash
firebase functions:config:set security.allowed_origins="http://localhost:3000"
```

### Issue: Cannot read Firebase config
**Solution:** Make sure `.env` file exists and has correct values. Restart the React dev server after changing `.env`.

## Production Deployment

When ready for production:

1. Update `.env` with production values
2. Build the React app:
   ```bash
   npm run build
   ```
3. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Next Steps

- Set up GitHub Actions for CI/CD (see `.github/workflows/`)
- Configure custom domain in Firebase Hosting
- Enable Firebase Analytics
- Set up monitoring and alerts
- Configure backup strategies for Realtime Database

## Useful Commands

```bash
# View current project
firebase projects:list

# Switch between projects
firebase use dev
firebase use production

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only database

# View Functions logs
firebase functions:log

# Export emulator data
firebase emulators:export ./emulator-backup

# Import emulator data
firebase emulators:start --import ./emulator-backup
```

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
