import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { APP_CONFIG } from '../config/routes';
import toast from 'react-hot-toast';
import FirebaseTest from '../components/FirebaseTest';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, signup, signInWithGoogle, resetPassword, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignupForm,
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onLogin = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data) => {
    setLoading(true);
    try {
      await signup(data.email, data.password, data.displayName);
      toast.success('Account created! Please check your email for verification.');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt('Enter your email address:');
    if (email) {
      try {
        await resetPassword(email);
        toast.success('Password reset email sent!');
      } catch (error) {
        toast.error(error.message || 'Failed to send reset email');
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{isLogin ? 'Sign In' : 'Sign Up'} - {APP_CONFIG.appName}</title>
        <meta name="description" content={`${isLogin ? 'Sign in' : 'Create an account'} to access live sports scores and join the community`} />
      </Helmet>

      {/* Temporary Firebase Test Component */}
      {process.env.NODE_ENV === 'development' && <FirebaseTest />}

      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className={`max-w-md w-full space-y-8 ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 rounded-xl shadow-xl`}>
          <div>
            <h2 className="text-center text-3xl font-extrabold">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </h2>
            <p className={`mt-2 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  resetLoginForm();
                  resetSignupForm();
                }}
                className="font-medium text-blue-500 hover:text-blue-600"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Google Sign In */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                Or continue with
              </span>
            </div>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  {...registerLogin('email')}
                  type="email"
                  autoComplete="email"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${loginErrors.email ? 'border-red-500' : ''}`}
                />
                {loginErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{loginErrors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  {...registerLogin('password')}
                  type="password"
                  autoComplete="current-password"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${loginErrors.password ? 'border-red-500' : ''}`}
                />
                {loginErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{loginErrors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Forgot your password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            // Signup Form
            <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  {...registerSignup('displayName')}
                  type="text"
                  autoComplete="name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${signupErrors.displayName ? 'border-red-500' : ''}`}
                />
                {signupErrors.displayName && (
                  <p className="mt-1 text-sm text-red-500">{signupErrors.displayName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  {...registerSignup('email')}
                  type="email"
                  autoComplete="email"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${signupErrors.email ? 'border-red-500' : ''}`}
                />
                {signupErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{signupErrors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  {...registerSignup('password')}
                  type="password"
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${signupErrors.password ? 'border-red-500' : ''}`}
                />
                {signupErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{signupErrors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  {...registerSignup('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  } ${signupErrors.confirmPassword ? 'border-red-500' : ''}`}
                />
                {signupErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{signupErrors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
          )}

          <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-blue-500 hover:text-blue-600">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-500 hover:text-blue-600">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;
