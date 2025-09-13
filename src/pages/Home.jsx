import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { APP_CONFIG, SUPPORTED_SPORTS } from '../config/routes';
import LiveTicker from '../components/LiveTicker';
import MatchCard from '../components/MatchCard';
import { fetchCricketData } from '../services/api/sports/cricketApi';
import toast from 'react-hot-toast';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [cricketData, setCricketData] = useState({ live: [], upcoming: [], recent: [] });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadCricketData = async () => {
      try {
        setLoading(true);
        const data = await fetchCricketData();
        setCricketData(data);
      } catch (error) {
        console.error('Error loading cricket data:', error);
        toast.error('Failed to load match data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCricketData();
    
    // Refresh data every minute
    const interval = setInterval(loadCricketData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Helmet>
        <title>{APP_CONFIG.appName} - Real-time Sports Tracking & Community</title>
        <meta name="description" content={APP_CONFIG.appDescription} />
      </Helmet>

      <div className="space-y-12">
        {/* Hero Section */}
        <section className={`relative overflow-hidden rounded-2xl ${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-500 to-green-500'} p-12 text-white`}>
          <div className="relative z-10">
            <h1 className="text-5xl font-bold mb-4">
              Welcome to {APP_CONFIG.appName}
            </h1>
            <p className="text-xl mb-8 opacity-90">
              {APP_CONFIG.appTagline}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/explore"
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Explore Sports
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/auth"
                  className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Join Community
                </Link>
              )}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-60 h-60 bg-white opacity-10 rounded-full"></div>
        </section>

        {/* Live Matches Ticker */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Live Matches</h2>
            <Link 
              to="/sport/cricket" 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              View All Matches →
            </Link>
          </div>
          <LiveTicker sport="cricket" maxItems={5} />
        </section>

        {/* Sports Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Choose Your Sport</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUPPORTED_SPORTS.map((sport) => (
              <Link
                key={sport.id}
                to={`/sport/${sport.id}`}
                className={`group relative overflow-hidden rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="p-8">
                  <div className="text-4xl mb-4">{sport.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{sport.name}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {sport.description}
                  </p>
                  <div className="mt-4 inline-flex items-center text-blue-500 font-medium">
                    Explore {sport.name}
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-r from-${sport.color}-500 to-${sport.color}-600 opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              </Link>
            ))}
          </div>
        </section>

        {/* Live and Upcoming Matches */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Cricket Matches</h2>
            <Link 
              to="/sport/cricket" 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              View All Matches →
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Live Matches */}
              {cricketData.live.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-500">🔴 Live Now</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cricketData.live.map((match) => (
                      <MatchCard key={match.id} match={match} sport="cricket" />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upcoming Matches */}
              {cricketData.upcoming.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Upcoming Matches</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cricketData.upcoming.slice(0, 4).map((match) => (
                      <MatchCard key={match.id} match={match} sport="cricket" />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Matches */}
              {cricketData.recent.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cricketData.recent.slice(0, 2).map((match) => (
                      <MatchCard key={match.id} match={match} sport="cricket" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Recent Community Posts */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Community Discussions</h2>
            <Link 
              to="/community/cricket" 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Join Discussion →
            </Link>
          </div>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className="text-center py-8">
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No recent posts. Be the first to start a discussion!
              </p>
              {isAuthenticated ? (
                <Link
                  to="/community/cricket"
                  className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Post
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Sign In to Post
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl p-8`}>
          <h2 className="text-2xl font-bold mb-8 text-center">Why Choose {APP_CONFIG.appName}?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                ⚡
              </div>
              <h3 className="font-semibold mb-2">Real-time Updates</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Get instant score updates and notifications for your favorite matches
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                👥
              </div>
              <h3 className="font-semibold mb-2">Active Community</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Join discussions with passionate sports fans from around the world
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl">
                📊
              </div>
              <h3 className="font-semibold mb-2">Detailed Stats</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Access comprehensive statistics and match analysis
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!isAuthenticated && (
          <section className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
              Join thousands of sports enthusiasts on {APP_CONFIG.appName}
            </p>
            <Link
              to="/auth"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Sign Up for Free
            </Link>
          </section>
        )}
      </div>
    </>
  );
};

export default Home;
