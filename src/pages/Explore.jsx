import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../contexts/ThemeContext';
import { SUPPORTED_SPORTS, APP_CONFIG } from '../config/routes';

const Explore = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState(null);

  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <>
      <Helmet>
        <title>Explore Sports - {APP_CONFIG.appName}</title>
        <meta name="description" content="Explore cricket, football, kabaddi and more sports with live scores and community discussions" />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Explore Sports</h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose a sport to view live scores, matches, series, and join the community
          </p>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {SUPPORTED_SPORTS.map((sport) => (
            <div
              key={sport.id}
              className={`relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${
                selectedSport?.id === sport.id ? 'ring-4 ring-blue-500' : ''
              }`}
              onClick={() => handleSportSelect(sport)}
            >
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-8`}>
                <div className="text-6xl mb-4 text-center">{sport.icon}</div>
                <h2 className="text-2xl font-bold text-center mb-3">{sport.name}</h2>
                <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                  {sport.description}
                </p>
                
                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(`/sport/${sport.id}`);
                    }}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    View Matches
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(`/sport/${sport.id}/series`);
                    }}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Browse Series
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(`/community/${sport.id}`);
                    }}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Join Community
                  </button>
                </div>

                {/* Sport Stats */}
                <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Live Now</p>
                      <p className="text-lg font-semibold">0</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Today</p>
                      <p className="text-lg font-semibold">0</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Community</p>
                      <p className="text-lg font-semibold">0</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Selected Sport Details */}
        {selectedSport && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8 mb-12`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{selectedSport.icon}</span>
                <h2 className="text-3xl font-bold">{selectedSport.name}</h2>
              </div>
              <button
                onClick={() => setSelectedSport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to={`/sport/${selectedSport.id}`}
                className={`p-6 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
              >
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold mb-1">Live Scores</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Real-time match updates
                </p>
              </Link>

              <Link
                to={`/sport/${selectedSport.id}/series`}
                className={`p-6 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
              >
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-semibold mb-1">Series & Tournaments</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Browse ongoing series
                </p>
              </Link>

              <Link
                to={`/community/${selectedSport.id}`}
                className={`p-6 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
              >
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-semibold mb-1">Community</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Join discussions
                </p>
              </Link>

              <Link
                to={`/sport/${selectedSport.id}/stats`}
                className={`p-6 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
              >
                <div className="text-2xl mb-2">📈</div>
                <h3 className="font-semibold mb-1">Statistics</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Detailed analytics
                </p>
              </Link>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl p-8`}>
          <h2 className="text-2xl font-bold mb-6 text-center">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-red-500 rounded-full flex items-center justify-center text-white">
                🔴
              </div>
              <h3 className="font-semibold mb-1">Live Updates</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Real-time scores
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center text-white">
                📱
              </div>
              <h3 className="font-semibold mb-1">Mobile Ready</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Access anywhere
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-500 rounded-full flex items-center justify-center text-white">
                🔔
              </div>
              <h3 className="font-semibold mb-1">Notifications</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Never miss updates
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-500 rounded-full flex items-center justify-center text-white">
                👥
              </div>
              <h3 className="font-semibold mb-1">Community</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Connect with fans
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Explore;
