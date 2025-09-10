import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRealtimeDatabase } from '../hooks/useRealtimeDatabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { APP_CONFIG, SPORTS } from '../config/routes';
import { sanitizeText } from '../utils/sanitize';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUserProfile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    favoriteTeams: [],
    favoriteSports: [],
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      setProfileData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        favoriteTeams: user.favoriteTeams || [],
        favoriteSports: user.favoriteSports || [],
      });
    }
  }, [user, navigate]);

  // Fetch user's posts
  const { data: userPosts, isLoading: postsLoading } = useRealtimeDatabase(
    user ? `users/${user.uid}/posts` : null,
    {
      orderBy: 'timestamp',
      limitToLast: 20,
    }
  );

  // Fetch followed matches
  const { data: followedMatches, isLoading: matchesLoading } = useRealtimeDatabase(
    user ? `users/${user.uid}/followedMatches` : null
  );

  const handleUpdateProfile = async () => {
    try {
      const sanitizedData = {
        ...profileData,
        displayName: sanitizeText(profileData.displayName),
        bio: sanitizeText(profileData.bio),
      };
      
      await updateUserProfile(sanitizedData);
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // Implementation would delete user account
        toast.success('Account deleted');
        navigate('/');
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  const memberSince = user.metadata?.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString()
    : 'Unknown';

  return (
    <>
      <Helmet>
        <title>Profile - {APP_CONFIG.appName}</title>
        <meta name="description" content="Manage your profile and preferences" />
      </Helmet>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  {editMode ? (
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className={`text-2xl font-bold mb-1 px-2 py-1 rounded ${
                        isDark ? 'bg-gray-700 text-white' : 'bg-gray-100'
                      }`}
                    />
                  ) : (
                    <h1 className="text-2xl font-bold mb-1">{user.displayName || 'Anonymous User'}</h1>
                  )}
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Member since {memberSince}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                {editMode ? (
                  <>
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setProfileData({
                          displayName: user.displayName || '',
                          bio: user.bio || '',
                          favoriteTeams: user.favoriteTeams || [],
                          favoriteSports: user.favoriteSports || [],
                        });
                      }}
                      className={`px-4 py-2 rounded-lg ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4">
              {editMode ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className={`w-full px-3 py-2 rounded-lg resize-none ${
                    isDark ? 'bg-gray-700 text-white' : 'bg-gray-100'
                  }`}
                  rows="3"
                />
              ) : (
                profileData.bio && (
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.bio}
                  </p>
                )
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-2xl font-bold`}>{userPosts?.length || 0}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Posts</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-2xl font-bold`}>{followedMatches?.length || 0}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Following</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-2xl font-bold`}>{user.karma || 0}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Karma</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-4 border-b">
              {['overview', 'posts', 'following', 'settings'].map((tab) => (
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
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Favorite Sports */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Favorite Sports</h3>
                  {editMode ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(SPORTS).map(([key, sport]) => {
                        const isSelected = profileData.favoriteSports.includes(key);
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setProfileData({
                                ...profileData,
                                favoriteSports: isSelected
                                  ? profileData.favoriteSports.filter(s => s !== key)
                                  : [...profileData.favoriteSports, key]
                              });
                            }}
                            className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                              isSelected
                                ? 'bg-blue-500 text-white'
                                : isDark ? 'bg-gray-700' : 'bg-gray-100'
                            }`}
                          >
                            <span>{sport.icon}</span>
                            <span>{sport.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profileData.favoriteSports.length > 0 ? (
                        profileData.favoriteSports.map(sportKey => {
                          const sport = SPORTS[sportKey];
                          return sport ? (
                            <div
                              key={sportKey}
                              className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                                isDark ? 'bg-gray-700' : 'bg-gray-100'
                              }`}
                            >
                              <span>{sport.icon}</span>
                              <span>{sport.name}</span>
                            </div>
                          ) : null;
                        })
                      ) : (
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          No favorite sports selected
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  {userPosts && userPosts.length > 0 ? (
                    <div className="space-y-3">
                      {userPosts.slice(0, 5).map(post => (
                        <div
                          key={post.id}
                          onClick={() => navigate(`/post/${post.id}`)}
                          className={`p-3 rounded-lg cursor-pointer ${
                            isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <p className="font-medium">{post.title}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(post.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                {postsLoading ? (
                  <LoadingSpinner />
                ) : userPosts && userPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userPosts.map(post => (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/post/${post.id}`)}
                        className={`p-4 rounded-lg cursor-pointer ${
                          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <h4 className="font-semibold mb-2">{post.title}</h4>
                        <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(post.timestamp).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>{post.likes || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>{post.commentCount || 0}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    You haven't created any posts yet
                  </p>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <div>
                {matchesLoading ? (
                  <LoadingSpinner />
                ) : followedMatches && followedMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followedMatches.map(match => (
                      <div
                        key={match.id}
                        onClick={() => navigate(`/match/${match.sport}/${match.id}`)}
                        className={`p-4 rounded-lg cursor-pointer ${
                          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(match.startTime).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            match.status === 'live' 
                              ? 'bg-red-500 text-white' 
                              : match.status === 'upcoming'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            {match.status}
                          </span>
                        </div>
                        <p className="font-semibold">
                          {match.homeTeam} vs {match.awayTeam}
                        </p>
                        {match.status !== 'upcoming' && (
                          <p className="text-lg font-bold mt-1">
                            {match.homeScore} - {match.awayScore}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    You're not following any matches yet
                  </p>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Notifications */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span>Email notifications</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Push notifications</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Match reminders</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                  </div>
                </div>

                {/* Appearance */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                  <div className="flex items-center justify-between">
                    <span>Dark Mode</span>
                    <button
                      onClick={toggleTheme}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        isDark ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isDark ? 'translate-x-6' : ''
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Privacy */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Privacy</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span>Make profile public</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Show activity status</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="pt-6 border-t space-y-3">
                  <button
                    onClick={handleLogout}
                    className={`w-full px-4 py-2 rounded-lg text-left ${
                      isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-left"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
