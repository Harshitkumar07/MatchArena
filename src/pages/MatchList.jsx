import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRealtimeDatabase } from '../hooks/useRealtimeDatabase';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { SPORTS, APP_CONFIG } from '../config/routes';
import toast from 'react-hot-toast';

const MatchList = () => {
  const { sport } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time');

  // Validate sport parameter
  const sportConfig = SPORTS[sport];
  if (!sportConfig) {
    navigate('/explore');
    return null;
  }

  // Fetch matches for the sport
  const { data: matches, isLoading, error } = useRealtimeDatabase(
    `matches/${sport}`,
    {
      orderBy: 'startTime',
      limitToLast: 50,
    }
  );

  // Filter matches based on status
  const filteredMatches = matches?.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'live') return match.status === 'live';
    if (filter === 'upcoming') return match.status === 'upcoming';
    if (filter === 'completed') return match.status === 'completed';
    return true;
  }).filter(match => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      match.homeTeam?.toLowerCase().includes(search) ||
      match.awayTeam?.toLowerCase().includes(search) ||
      match.venue?.toLowerCase().includes(search) ||
      match.competition?.toLowerCase().includes(search)
    );
  });

  // Sort matches
  const sortedMatches = filteredMatches?.sort((a, b) => {
    if (sortBy === 'time') {
      return new Date(b.startTime) - new Date(a.startTime);
    }
    if (sortBy === 'competition') {
      return (a.competition || '').localeCompare(b.competition || '');
    }
    return 0;
  });

  const handleFollowMatch = async (matchId) => {
    if (!user) {
      toast.error('Please sign in to follow matches');
      navigate('/auth');
      return;
    }
    // Implementation would go here
    toast.success('Match added to your favorites');
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error loading matches</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{sportConfig.name} Matches - {APP_CONFIG.appName}</title>
        <meta name="description" content={`Live scores and updates for ${sportConfig.name} matches`} />
      </Helmet>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{sportConfig.icon}</span>
                <div>
                  <h1 className="text-3xl font-bold">{sportConfig.name}</h1>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Live scores and match updates
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/explore')}
                className={`px-4 py-2 rounded-lg ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Back to Sports
              </button>
            </div>

            {/* Filters and Search */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search teams, venues, competitions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                  {['all', 'live', 'upcoming', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-lg capitalize ${
                        filter === status
                          ? 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                      {status === 'live' && (
                        <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="time">Sort by Time</option>
                  <option value="competition">Sort by Competition</option>
                </select>
              </div>
            </div>
          </div>

          {/* Match Statistics */}
          {sortedMatches && sortedMatches.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Live Now</p>
                <p className="text-2xl font-bold text-red-500">
                  {sortedMatches.filter(m => m.status === 'live').length}
                </p>
              </div>
              <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Today</p>
                <p className="text-2xl font-bold text-blue-500">
                  {sortedMatches.filter(m => {
                    const matchDate = new Date(m.startTime);
                    const today = new Date();
                    return matchDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Matches</p>
                <p className="text-2xl font-bold">
                  {sortedMatches.length}
                </p>
              </div>
            </div>
          )}

          {/* Matches List */}
          {isLoading ? (
            <LoadingSpinner />
          ) : sortedMatches && sortedMatches.length > 0 ? (
            <div className="space-y-4">
              {/* Group matches by date */}
              {Object.entries(
                sortedMatches.reduce((groups, match) => {
                  const date = new Date(match.startTime).toDateString();
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(match);
                  return groups;
                }, {})
              ).map(([date, dateMatches]) => (
                <div key={date}>
                  <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {date === new Date().toDateString() ? 'Today' : date}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dateMatches.map((match) => (
                      <div key={match.id} className="relative">
                        <MatchCard
                          match={{
                            ...match,
                            sport,
                            sportIcon: sportConfig.icon,
                          }}
                          onClick={() => navigate(`/match/${sport}/${match.id}`)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowMatch(match.id);
                          }}
                          className={`absolute top-2 right-2 p-2 rounded-full ${
                            isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                          } shadow-lg`}
                          title="Follow match"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
              <span className="text-6xl mb-4 block">🏏</span>
              <p className="text-xl font-semibold mb-2">No matches found</p>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm ? 'Try adjusting your search terms' : 'Check back later for upcoming matches'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {sortedMatches && sortedMatches.length > 20 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex space-x-2">
                <button className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  Previous
                </button>
                <button className={`px-4 py-2 rounded-lg bg-blue-500 text-white`}>
                  1
                </button>
                <button className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  2
                </button>
                <button className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MatchList;
