import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../services/firebase/firebaseClient';

// Mock Firebase auth and db
jest.mock('../../services/firebase/firebaseClient');

describe('AuthContext', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('provides default auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  test('login function calls Firebase auth', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    auth.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  test('signup function calls Firebase auth and creates user profile', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    auth.createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    
    const mockDbRef = {
      set: jest.fn().mockResolvedValue(),
    };
    db.ref.mockReturnValue(mockDbRef);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signup('test@example.com', 'password123', 'Test User');
    });

    expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(db.ref).toHaveBeenCalledWith('users/123');
    expect(mockDbRef.set).toHaveBeenCalled();
  });

  test('logout function calls Firebase signOut', async () => {
    auth.signOut.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(auth.signOut).toHaveBeenCalled();
  });

  test('signInWithGoogle calls appropriate Firebase method', async () => {
    const mockGoogleAuthProvider = jest.fn();
    const mockSignInWithPopup = jest.fn().mockResolvedValue({
      user: { uid: '123', email: 'test@gmail.com' },
    });

    auth.GoogleAuthProvider = mockGoogleAuthProvider;
    auth.signInWithPopup = mockSignInWithPopup;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockSignInWithPopup).toHaveBeenCalled();
  });

  test('resetPassword calls Firebase password reset', async () => {
    auth.sendPasswordResetEmail = jest.fn().mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(auth.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
  });

  test('updateUserProfile updates user data in database', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    const mockDbRef = {
      update: jest.fn().mockResolvedValue(),
    };
    
    auth.currentUser = mockUser;
    db.ref.mockReturnValue(mockDbRef);

    const { result } = renderHook(() => useAuth(), { wrapper });

    const profileData = { displayName: 'New Name', bio: 'New bio' };

    await act(async () => {
      await result.current.updateUserProfile(profileData);
    });

    expect(db.ref).toHaveBeenCalledWith('users/123');
    expect(mockDbRef.update).toHaveBeenCalledWith(profileData);
  });

  test('checkUserRole verifies admin status', async () => {
    const mockUser = { 
      uid: '123', 
      email: 'admin@example.com',
      getIdTokenResult: jest.fn().mockResolvedValue({
        claims: { admin: true }
      })
    };

    const { result } = renderHook(() => useAuth(), { wrapper });

    const isAdmin = await act(async () => {
      return await result.current.checkUserRole(mockUser);
    });

    expect(mockUser.getIdTokenResult).toHaveBeenCalled();
  });

  test('refreshToken refreshes user authentication token', async () => {
    const mockUser = {
      uid: '123',
      getIdToken: jest.fn().mockResolvedValue('new-token'),
    };

    auth.currentUser = mockUser;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const token = await result.current.refreshToken();
      expect(token).toBe('new-token');
    });

    expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
  });
});
