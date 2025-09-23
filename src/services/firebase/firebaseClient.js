import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';
import { getPerformance } from 'firebase/performance';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAHih9ia5LOwbTp8vlBn5dUQKeTsaPFhzI",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "matcharena-app-e3d24.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://matcharena-app-e3d24-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "matcharena-app-e3d24",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "matcharena-app-e3d24.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "678280737385",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:678280737385:web:201a80588904e517aea8f8",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-BYTZ8KDE5W"
};

// Debug: Log configuration (remove in production)
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'MISSING',
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const functions = getFunctions(app);

// Initialize Analytics (only if enabled and supported)
let analytics = null;
if (process.env.REACT_APP_ANALYTICS_ENABLED === 'true') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Initialize Performance Monitoring (production only)
let performance = null;
if (process.env.NODE_ENV === 'production') {
  performance = getPerformance(app);
}

// Connect to emulators in development - DISABLED for now
// Uncomment below to use emulators
/*
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATORS === 'true') {
  if (!window._firebaseEmulatorsConnected) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectDatabaseEmulator(database, 'localhost', 9000);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      window._firebaseEmulatorsConnected = true;
      console.log('🔥 Connected to Firebase Emulators');
    } catch (error) {
      console.warn('Failed to connect to Firebase Emulators:', error);
    }
  }
}
*/

export { app, analytics, performance };

// Helper to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId
  );
};

// Export Firebase SDK for advanced usage
export { getAuth } from 'firebase/auth';
export { getDatabase } from 'firebase/database';
export { getFunctions } from 'firebase/functions';
export { getAnalytics } from 'firebase/analytics';
export { getPerformance } from 'firebase/performance';
