import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  reload
} from 'firebase/auth';
import { auth } from '../services/firebase/firebaseClient';
import { write, readOnce } from '../services/firebase/database';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('user');

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Get user role from custom claims
        const tokenResult = await user.getIdTokenResult();
        const role = tokenResult.claims.role || 'user';
        setUserRole(role);

        // Fetch user profile from database
        const profile = await readOnce(`users/${user.uid}`);
        if (profile) {
          setUserProfile(profile);
        } else {
          // Create initial profile if it doesn't exist
          const initialProfile = {
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            role: role,
            sports: {
              cricket: true,
              football: false,
              kabaddi: false
            },
            createdAt: Date.now(),
            lastLogin: Date.now()
          };
          await write(`users/${user.uid}`, initialProfile);
          setUserProfile(initialProfile);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setUserRole('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Send email verification
      await sendEmailVerification(user);
      
      // Create user profile in database
      const profile = {
        displayName: displayName || '',
        email: email,
        photoURL: '',
        role: 'user',
        sports: {
          cricket: true,
          football: false,
          kabaddi: false
        },
        createdAt: Date.now(),
        lastLogin: Date.now(),
        emailVerified: false
      };
      
      await write(`users/${user.uid}`, profile);
      
      toast.success('Account created! Please check your email for verification.');
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login
      await write(`users/${userCredential.user.uid}/lastLogin`, Date.now());
      
      toast.success('Welcome back!');
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists
      const existingProfile = await readOnce(`users/${user.uid}`);
      
      if (!existingProfile) {
        // Create new profile for Google user
        const profile = {
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role: 'user',
          sports: {
            cricket: true,
            football: false,
            kabaddi: false
          },
          createdAt: Date.now(),
          lastLogin: Date.now(),
          emailVerified: true,
          provider: 'google'
        };
        await write(`users/${user.uid}`, profile);
      } else {
        // Update last login
        await write(`users/${user.uid}/lastLogin`, Date.now());
      }
      
      toast.success('Signed in with Google!');
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    
    try {
      // Update Firebase Auth profile if display name or photo changed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(currentUser, {
          displayName: updates.displayName || currentUser.displayName,
          photoURL: updates.photoURL || currentUser.photoURL
        });
      }

      // Update database profile
      await write(`users/${currentUser.uid}`, {
        ...userProfile,
        ...updates,
        updatedAt: Date.now()
      });

      setUserProfile(prev => ({ ...prev, ...updates }));
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!currentUser) return;
    
    try {
      await sendEmailVerification(currentUser);
      toast.success('Verification email sent!');
    } catch (error) {
      console.error('Verification email error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  // Refresh user token to get latest claims
  const refreshUserToken = async () => {
    if (!currentUser) return;
    
    try {
      await reload(currentUser);
      const tokenResult = await currentUser.getIdTokenResult(true);
      const role = tokenResult.claims.role || 'user';
      setUserRole(role);
      return role;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (role === 'user') return true;
    if (role === 'moderator') return userRole === 'moderator' || userRole === 'admin';
    if (role === 'admin') return userRole === 'admin';
    return false;
  };

  const value = {
    currentUser,
    userProfile,
    userRole,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    updateUserProfile,
    resendVerificationEmail,
    refreshUserToken,
    hasRole,
    isAuthenticated: !!currentUser,
    isEmailVerified: currentUser?.emailVerified || false,
    isAdmin: userRole === 'admin',
    isModerator: userRole === 'moderator' || userRole === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
