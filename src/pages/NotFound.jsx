import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../contexts/ThemeContext';
import { APP_CONFIG } from '../config/routes';

const NotFound = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <>
      <Helmet>
        <title>404 - Page Not Found - {APP_CONFIG.appName}</title>
        <meta name="description" content="The page you're looking for doesn't exist" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          {/* 404 Animation */}
          <div className="mb-8">
            <div className="relative">
              <div className="text-9xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-bounce">
                  🏏
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold mb-4">
            Oops! Out of bounds!
          </h1>
          <p className={`text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Looks like this page went for a six and never came back. 
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Sports Icons */}
          <div className="flex justify-center space-x-4 mb-8">
            <span className="text-3xl animate-pulse" style={{ animationDelay: '0s' }}>⚽</span>
            <span className="text-3xl animate-pulse" style={{ animationDelay: '0.2s' }}>🏀</span>
            <span className="text-3xl animate-pulse" style={{ animationDelay: '0.4s' }}>🏈</span>
            <span className="text-3xl animate-pulse" style={{ animationDelay: '0.6s' }}>⚾</span>
            <span className="text-3xl animate-pulse" style={{ animationDelay: '0.8s' }}>🎾</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className={`w-full px-6 py-3 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-800 text-white hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Go Back
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12">
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Here are some helpful links:
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <button
                onClick={() => navigate('/explore')}
                className="text-blue-500 hover:text-blue-600"
              >
                Explore Sports
              </button>
              <button
                onClick={() => navigate('/community')}
                className="text-blue-500 hover:text-blue-600"
              >
                Community
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="text-blue-500 hover:text-blue-600"
              >
                Profile
              </button>
            </div>
          </div>

          {/* Fun Fact */}
          <div className={`mt-12 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-semibold">Fun Fact:</span> In cricket, a score of 404 would be 
              an excellent team total! Unfortunately, this page score isn't as impressive. 😅
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
