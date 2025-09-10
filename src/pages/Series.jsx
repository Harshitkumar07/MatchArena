import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRealtimeDatabase } from '../hooks/useRealtimeDatabase';
import LoadingSpinner from '../components/LoadingSpinner';
import MatchCard from '../components/MatchCard';
import { SPORTS, APP_CONFIG } from '../config/routes';
import toast from 'react-hot-toast';

const Series = () => {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch series details
  const { data: series, isLoading: seriesLoading } = useRealtimeDatabase(
    `series/${seriesId}`
  );

  // Fetch series matches
  const { data: matches, isLoading: matchesLoading } = useRealtimeDatabase(
    `series/${seriesId}/matches`,
    {
      orderBy: 'startTime',
    }
  );

  // Fetch standings/points table
  const { data: standings } = useRealtimeDatabase(
    `series/${seriesId}/standings`
  );

  const handleFollowSeries = async () => {
    if (!user) {
      toast.error('Please sign in to follow series');
      navigate('/auth');
      return;
    }
    // Implementation would go here
    toast.success('Following series');
  };

  if (seriesLoading) {
    return <LoadingSpinner />;
  }

  if (!series) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Series not found</p>
          <button
            onClick={() => navigate('/explore')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const sportConfig = SPORTS[series.sport];
  const upcomingMatches = matches?.filter(m => m.status === 'upcoming') || [];
  const completedMatches = matches?.filter(m => m.status === 'completed') || [];
  const liveMatches = matches?.filter(m => m.status === 'live') || [];

  return (
    <>
      <Helmet>
        <title>{series.name} - {APP_CONFIG.appName}</title>
        <meta name="description" content={`${series.name} tournament schedule, standings, and live scores`} />
      </Helmet>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Series Header */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {series.logo ? (
                  <img 
                    src={series.logo} 
                    alt={series.name}
                    className="w-20 h-20 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-3xl text-white">{sportConfig?.icon || '🏆'}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold mb-2">{series.name}</h1>
                  <div className={`flex items-center space-x-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>{sportConfig?.name || series.sport}</span>
                    <span>•</span>
                    <span>{series.format}</span>
                    <span>•</span>
                    <span>
                      {new Date(series.startDate).toLocaleDateString()} - {new Date(series.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {series.description && (
                    <p className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {series.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleFollowSeries}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>Follow</span>
              </button>
            </div>

            {/* Series Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Matches</p>
                <p className="text-xl font-bold">{matches?.length || 0}</p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Live Now</p>
                <p className="text-xl font-bold text-red-500">{liveMatches.length}</p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
                <p className="text-xl font-bold text-green-500">{completedMatches.length}</p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Upcoming</p>
                <p className="text-xl font-bold text-blue-500">{upcomingMatches.length}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-4 border-b">
              {['overview', 'matches', 'standings', 'stats', 'teams'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 capitalize font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-500'
                      : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
                  }`}
                >
                  {tab}
                  {tab === 'matches' && liveMatches.length > 0 && (
                    <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Current/Next Match */}
                {(liveMatches.length > 0 || upcomingMatches.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {liveMatches.length > 0 ? 'Live Now' : 'Next Match'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(liveMatches.length > 0 ? liveMatches : upcomingMatches.slice(0, 2)).map(match => (
                        <MatchCard
                          key={match.id}
                          match={{
                            ...match,
                            sport: series.sport,
                            sportIcon: sportConfig?.icon,
                          }}
                          onClick={() => navigate(`/match/${series.sport}/${match.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Results */}
                {completedMatches.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Results</h3>
                    <div className="space-y-3">
                      {completedMatches.slice(0, 3).map(match => (
                        <div 
                          key={match.id}
                          onClick={() => navigate(`/match/${series.sport}/${match.id}`)}
                          className={`p-4 rounded-lg cursor-pointer transition-colors ${
                            isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(match.startTime).toLocaleDateString()}
                              </span>
                              <span className="font-medium">
                                {match.homeTeam} vs {match.awayTeam}
                              </span>
                            </div>
                            <span className="font-semibold">
                              {match.result || `${match.homeScore} - ${match.awayScore}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tournament Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tournament Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Format</p>
                        <p className="font-medium">{series.format}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Prize Pool</p>
                        <p className="font-medium">{series.prizePool || 'TBA'}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Venue(s)</p>
                        <p className="font-medium">{series.venues?.join(', ') || 'Various'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Sponsors</h3>
                    <div className="flex flex-wrap gap-3">
                      {series.sponsors?.map((sponsor, index) => (
                        <div 
                          key={index}
                          className={`px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                          {sponsor}
                        </div>
                      )) || <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No sponsors listed</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <div>
                {matchesLoading ? (
                  <LoadingSpinner />
                ) : matches && matches.length > 0 ? (
                  <div className="space-y-6">
                    {liveMatches.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-red-500">Live Matches</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {liveMatches.map(match => (
                            <MatchCard
                              key={match.id}
                              match={{
                                ...match,
                                sport: series.sport,
                                sportIcon: sportConfig?.icon,
                              }}
                              onClick={() => navigate(`/match/${series.sport}/${match.id}`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {upcomingMatches.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Upcoming Matches</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {upcomingMatches.map(match => (
                            <MatchCard
                              key={match.id}
                              match={{
                                ...match,
                                sport: series.sport,
                                sportIcon: sportConfig?.icon,
                              }}
                              onClick={() => navigate(`/match/${series.sport}/${match.id}`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {completedMatches.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Completed Matches</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {completedMatches.map(match => (
                            <MatchCard
                              key={match.id}
                              match={{
                                ...match,
                                sport: series.sport,
                                sportIcon: sportConfig?.icon,
                              }}
                              onClick={() => navigate(`/match/${series.sport}/${match.id}`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No matches scheduled yet
                  </p>
                )}
              </div>
            )}

            {/* Standings Tab */}
            {activeTab === 'standings' && (
              <div>
                {standings && standings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <th className="px-4 py-3 text-left">Pos</th>
                          <th className="px-4 py-3 text-left">Team</th>
                          <th className="px-4 py-3 text-center">P</th>
                          <th className="px-4 py-3 text-center">W</th>
                          <th className="px-4 py-3 text-center">L</th>
                          <th className="px-4 py-3 text-center">NR</th>
                          <th className="px-4 py-3 text-center">NRR</th>
                          <th className="px-4 py-3 text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((team, index) => (
                          <tr 
                            key={team.id}
                            className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
                              index < 4 ? 'bg-green-500 bg-opacity-10' : ''
                            }`}
                          >
                            <td className="px-4 py-3">{index + 1}</td>
                            <td className="px-4 py-3 font-medium">{team.name}</td>
                            <td className="px-4 py-3 text-center">{team.played}</td>
                            <td className="px-4 py-3 text-center">{team.won}</td>
                            <td className="px-4 py-3 text-center">{team.lost}</td>
                            <td className="px-4 py-3 text-center">{team.noResult}</td>
                            <td className="px-4 py-3 text-center">{team.netRunRate}</td>
                            <td className="px-4 py-3 text-center font-bold">{team.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Standings will be updated after matches begin
                  </p>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Scorers</h3>
                  <div className="space-y-3">
                    {series.topScorers?.slice(0, 5).map((player, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isDark ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {player.team}
                          </p>
                        </div>
                        <span className="text-xl font-bold">{player.runs}</span>
                      </div>
                    )) || (
                      <p className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No stats available yet
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Wicket Takers</h3>
                  <div className="space-y-3">
                    {series.topWicketTakers?.slice(0, 5).map((player, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isDark ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {player.team}
                          </p>
                        </div>
                        <span className="text-xl font-bold">{player.wickets}</span>
                      </div>
                    )) || (
                      <p className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No stats available yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {series.teams?.map((team) => (
                  <div 
                    key={team.id}
                    className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center space-x-3">
                      {team.logo ? (
                        <img 
                          src={team.logo} 
                          alt={team.name}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {team.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{team.name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {team.captain}
                        </p>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className={`col-span-full text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Teams will be announced soon
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Series;
