import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useRealtimeDatabase';
import { APP_CONFIG, SUPPORTED_SPORTS } from '../config/routes';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sportsDropdownOpen, setSportsDropdownOpen] = useState(false);
  const { currentUser, logout, isAdmin, isModerator } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                {APP_CONFIG.appName}
              </span>
              <span className="text-xl">🏏</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`${isActive('/') ? 'text-blue-500' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
            >
              Home
            </Link>
            
            <Link 
              to="/explore" 
              className={`${isActive('/explore') ? 'text-blue-500' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
            >
              Explore
            </Link>

            {/* Sports Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSportsDropdownOpen(!sportsDropdownOpen)}
                className={`flex items-center space-x-1 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
              >
                <span>Sports</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {sportsDropdownOpen && (
                <div className={`absolute left-0 mt-2 w-48 rounded-md shadow-lg ${isDark ? 'bg-gray-700' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1">
                    {SUPPORTED_SPORTS.map((sport) => (
                      <Link
                        key={sport.id}
                        to={`/sport/${sport.id}`}
                        className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setSportsDropdownOpen(false)}
                      >
                        <span className="mr-2">{sport.icon}</span>
                        {sport.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Community */}
            <Link 
              to="/community/cricket" 
              className={`${location.pathname.startsWith('/community') ? 'text-blue-500' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
            >
              Community
            </Link>

            {/* Admin Link (if admin) */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className={`${isActive('/admin') ? 'text-blue-500' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            
            {currentUser ? (
              <>
                <NotificationBell />
                
                <Link 
                  to="/profile"
                  className={`flex items-center space-x-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName} 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-bold">
                      {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium">
                    {currentUser.displayName || 'Profile'}
                  </span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${isDark ? 'text-gray-300' : 'text-gray-700'} hover:text-gray-900 focus:outline-none`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className={`md:hidden ${isDark ? 'bg-gray-800' : 'bg-white'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'bg-blue-500 text-white' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            <Link
              to="/explore"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/explore') ? 'bg-blue-500 text-white' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </Link>

            {/* Sports in mobile menu */}
            <div className="px-3 py-2">
              <div className={`text-base font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Sports</div>
              {SUPPORTED_SPORTS.map((sport) => (
                <Link
                  key={sport.id}
                  to={`/sport/${sport.id}`}
                  className={`block pl-6 py-1 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mr-2">{sport.icon}</span>
                  {sport.name}
                </Link>
              ))}
            </div>

            <Link
              to="/community/cricket"
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname.startsWith('/community') ? 'bg-blue-500 text-white' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Community
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin') ? 'bg-blue-500 text-white' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}

            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/profile') ? 'bg-blue-500 text-white' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="block px-3 py-2 rounded-md text-base font-medium bg-blue-500 text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
