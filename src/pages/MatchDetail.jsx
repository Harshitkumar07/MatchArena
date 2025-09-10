import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRealtimeDatabase } from '../hooks/useRealtimeDatabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { SPORTS, APP_CONFIG } from '../config/routes';
import { sanitizeText } from '../utils/sanitize';
import toast from 'react-hot-toast';

const MatchDetail = () => {
  const { sport, matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [comment, setComment] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  // Validate sport parameter
  const sportConfig = SPORTS[sport];
  if (!sportConfig) {
    navigate('/explore');
    return null;
  }

  // Fetch match details
  const { data: match, isLoading: matchLoading } = useRealtimeDatabase(
    `matches/${sport}/${matchId}`
  );

  // Fetch comments
  const { data: comments, isLoading: commentsLoading } = useRealtimeDatabase(
    `comments/matches/${matchId}`,
    {
      orderBy: 'timestamp',
      limitToLast: 50,
    }
  );

  // Fetch live updates
  const { data: liveUpdates } = useRealtimeDatabase(
    `liveUpdates/${matchId}`,
    {
      orderBy: 'timestamp',
      limitToLast: 20,
    }
  );

  useEffect(() => {
    // Check if user is following this match
    if (user && match) {
      // Implementation would check user's followed matches
      setIsFollowing(false);
    }
  }, [user, match]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error('Please sign in to follow matches');
      navigate('/auth');
      return;
    }
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? 'Unfollowed match' : 'Following match');
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      navigate('/auth');
      return;
    }
    if (!comment.trim()) return;

    try {
      // Implementation would add comment to database
      const sanitizedComment = sanitizeText(comment);
      console.log('Adding comment:', sanitizedComment);
      setComment('');
      toast.success('Comment posted');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  if (matchLoading) {
    return <LoadingSpinner />;
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Match not found</p>
          <button
            onClick={() => navigate(`/matches/${sport}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const isUpcoming = match.status === 'upcoming';

  return (
    <>
      <Helmet>
        <title>{match.homeTeam} vs {match.awayTeam} - {APP_CONFIG.appName}</title>
        <meta name="description" content={`Live score and updates for ${match.homeTeam} vs ${match.awayTeam} ${sportConfig.name} match`} />
      </Helmet>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/matches/${sport}`)}
            className={`mb-4 px-4 py-2 rounded-lg ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ← Back to {sportConfig.name} Matches
          </button>

          {/* Match Header */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{sportConfig.icon}</span>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {match.competition || sportConfig.name}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {match.venue}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isLive && (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
                {isCompleted && (
                  <span className="px-3 py-1 bg-gray-500 text-white text-sm font-semibold rounded-full">
                    COMPLETED
                  </span>
                )}
                {isUpcoming && (
                  <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                    UPCOMING
                  </span>
                )}
                <button
                  onClick={handleFollowToggle}
                  className={`p-2 rounded-full ${
                    isFollowing 
                      ? 'bg-blue-500 text-white' 
                      : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={isFollowing ? 'Unfollow' : 'Follow'}
                >
                  <svg className="w-5 h-5" fill={isFollowing ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Score Display */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Home Team */}
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {match.homeTeam}
                </div>
                {match.homeScore !== undefined && (
                  <div className="text-4xl font-bold">
                    {match.homeScore}
                  </div>
                )}
              </div>

              {/* VS or Time */}
              <div className="text-center">
                {isUpcoming ? (
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(match.startTime).toLocaleDateString()}
                    </p>
                    <p className="text-xl font-semibold">
                      {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ) : (
                  <div className="text-2xl font-semibold">VS</div>
                )}
                {isLive && match.currentTime && (
                  <p className="text-sm text-red-500 mt-2">{match.currentTime}'</p>
                )}
              </div>

              {/* Away Team */}
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {match.awayTeam}
                </div>
                {match.awayScore !== undefined && (
                  <div className="text-4xl font-bold">
                    {match.awayScore}
                  </div>
                )}
              </div>
            </div>

            {/* Match Status/Result */}
            {match.result && (
              <div className="mt-4 text-center">
                <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {match.result}
                </p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-4 border-b">
              {['overview', 'live', 'stats', 'comments'].map((tab) => (
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
                  {tab === 'live' && isLive && (
                    <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                  {tab === 'comments' && comments?.length > 0 && (
                    <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                      {comments.length}
                    </span>
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
                <div>
                  <h3 className="text-lg font-semibold mb-4">Match Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Competition</p>
                      <p className="font-medium">{match.competition || 'Regular Match'}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Venue</p>
                      <p className="font-medium">{match.venue || 'TBA'}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date & Time</p>
                      <p className="font-medium">
                        {new Date(match.startTime).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                      <p className="font-medium capitalize">{match.status}</p>
                    </div>
                  </div>
                </div>

                {match.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">About this Match</h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {match.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Live Updates Tab */}
            {activeTab === 'live' && (
              <div>
                {liveUpdates && liveUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {liveUpdates.map((update, index) => (
                      <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-start space-x-3">
                          <span className="text-sm font-semibold text-blue-500">
                            {update.time}'
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{update.title}</p>
                            {update.description && (
                              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {update.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isLive ? 'No live updates yet' : 'Live updates will appear when the match starts'}
                  </p>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div>
                {match.stats ? (
                  <div className="space-y-6">
                    {/* Sport-specific stats would go here */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">{match.homeTeam}</h4>
                        {/* Stats for home team */}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">{match.awayTeam}</h4>
                        {/* Stats for away team */}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isUpcoming ? 'Statistics will be available when the match starts' : 'No statistics available'}
                  </p>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                {/* Comment Form */}
                {user && (
                  <form onSubmit={handleCommentSubmit} className="mb-6">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className={`w-full p-3 rounded-lg resize-none ${
                        isDark 
                          ? 'bg-gray-700 text-white placeholder-gray-400' 
                          : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                      }`}
                      rows="3"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={!comment.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post Comment
                      </button>
                    </div>
                  </form>
                )}

                {/* Comments List */}
                {commentsLoading ? (
                  <LoadingSpinner />
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {c.userName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{c.userName || 'Anonymous'}</p>
                              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {new Date(c.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {c.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user ? 'Be the first to comment!' : 'Sign in to join the discussion'}
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

export default MatchDetail;
