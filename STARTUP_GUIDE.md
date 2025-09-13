# MatchArena - Startup Guide

## ✅ Project Setup Status

Your MatchArena project has been successfully configured with:

- ✅ React 18 with TypeScript support
- ✅ Firebase configuration (firebase.json, .firebaserc)
- ✅ Tailwind CSS for styling
- ✅ React Router for navigation
- ✅ Firebase Authentication context
- ✅ Realtime Database hooks
- ✅ All UI components and pages
- ✅ Security rules for Firebase
- ✅ GitHub Actions CI/CD
- ✅ Environment variables template

## 🚀 Quick Start

### Prerequisites Check

1. **Java Installation** (Required for Firebase Emulators)
   ```powershell
   # Check if Java is installed
   java -version
   
   # If not installed, run as Administrator:
   .\scripts\install-java.ps1
   ```

2. **Firebase Configuration**
   - Open `.env.local` file
   - Add your Firebase configuration values from Firebase Console
   - Ensure all `REACT_APP_FIREBASE_*` variables are set

### Starting the Application

#### Option 1: Development with Firebase Emulators (Recommended)

```bash
# Terminal 1: Start Firebase Emulators
firebase emulators:start

# Terminal 2: Start React Development Server
npm start
```

The app will be available at:
- React App: http://localhost:3000
- Firebase Emulator UI: http://localhost:4000

#### Option 2: Development without Emulators

1. Update `.env.local`:
   ```env
   REACT_APP_USE_EMULATORS=false
   ```

2. Start the React app:
   ```bash
   npm start
   ```

#### Option 3: Production Build

```bash
# Build the app
npm run build

# Test the production build locally
npx serve -s build
```

## 🔧 Common Issues & Solutions

### Issue: Firebase Config Not Found
**Solution:** Ensure `.env.local` has all required Firebase configuration values

### Issue: Java Not Found (for Emulators)
**Solution:** 
1. Install Java using the provided script: `.\scripts\install-java.ps1`
2. Or download manually from: https://adoptium.net/
3. Restart your terminal after installation

### Issue: Port Already in Use
**Solution:** Kill the process using the port or change ports in:
- React: `package.json` (PORT environment variable)
- Firebase: `firebase.json` (emulators section)

### Issue: Firebase Permission Errors
**Solution:** 
1. Check you're logged in: `firebase login`
2. Verify project: `firebase use`
3. Ensure you have proper permissions in Firebase Console

## 📋 Development Workflow

1. **Start Development Environment**
   ```bash
   # Start both emulators and React app
   npm run dev
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Lint Code**
   ```bash
   npm run lint
   ```

4. **Format Code**
   ```bash
   npm run format
   ```

## 🌐 Accessing the Application

Once started, you can access:

- **Home Page**: http://localhost:3000
- **Cricket Matches**: http://localhost:3000/sport/cricket
- **Football Matches**: http://localhost:3000/sport/football
- **Community**: http://localhost:3000/community/cricket
- **Profile**: http://localhost:3000/profile (requires login)
- **Admin Panel**: http://localhost:3000/admin (requires admin role)

## 📱 Features Available

### Public Features
- Browse live matches for Cricket, Football, and Kabaddi
- View match details and live scores
- Browse series and tournaments
- Read community posts

### Authenticated Features
- Create and vote on community posts
- Comment on posts
- Follow matches
- Manage profile
- Receive notifications

### Admin Features
- Moderate content
- Manage users
- Configure app settings
- View analytics

## 🚢 Deployment

### Deploy to Firebase Hosting

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**:
   ```bash
   # Deploy everything
   firebase deploy
   
   # Deploy only hosting
   firebase deploy --only hosting
   
   # Deploy to staging
   firebase use staging
   firebase deploy
   ```

3. **Access your deployed app**:
   - Production: https://matcharena-app.web.app
   - Staging: https://matcharena-staging.web.app

## 📝 Next Steps

1. **Complete Firebase Setup**
   - Create Firebase Web App in Console
   - Update `.env.local` with your configuration
   - Enable Authentication providers
   - Set up Realtime Database

2. **Add Sports API Integration**
   - Obtain API keys for sports data
   - Update Cloud Functions with API integration
   - Configure polling intervals

3. **Customize Branding**
   - Update logos and icons
   - Modify color scheme in Tailwind config
   - Update app metadata

4. **Set Up Monitoring**
   - Enable Firebase Analytics
   - Configure Performance Monitoring
   - Set up Error Reporting

## 🔗 Important Links

- [Firebase Console](https://console.firebase.google.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Documentation](https://firebase.google.com/docs)

## 💡 Tips

- Use Firebase Emulators during development to avoid costs
- Enable offline persistence for better user experience
- Test on multiple devices and browsers
- Monitor Firebase usage to stay within limits
- Keep dependencies updated regularly

## 🆘 Support

If you encounter issues:
1. Check the browser console for errors
2. Review Firebase Emulator logs
3. Check `firebase-debug.log` for detailed errors
4. Verify all environment variables are set
5. Ensure all dependencies are installed: `npm install`

---

Happy coding! 🎉 Your MatchArena app is ready for development.