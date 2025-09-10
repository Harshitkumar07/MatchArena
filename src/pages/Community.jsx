import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRealtimeDatabase } from '../hooks/useRealtimeDatabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { APP_CONFIG, SPORTS } from '../config/routes';
import { sanitizeText } from '../utils/sanitize';
import toast from 'react-hot-toast';

const Community = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedSport, setSelectedSport] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    sport: 'cricket',
    type: 'discussion',
  });

  // Fetch community posts
  const { data: posts, isLoading, refetch } = useRealtimeDatabase(
    'community/posts',
    {
      orderBy: 'timestamp',
      limitToLast: 50,
    }
  );

  // Filter and sort posts
  const filteredPosts = posts?.filter(post => {
    if (filter !== 'all' && post.type !== filter) return false;
    if (selectedSport !== 'all' && post.sport !== selectedSport) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.timestamp) - new Date(a.timestamp);
    if (sortBy === 'popular') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'comments') return (b.commentCount || 0) - (a.commentCount || 0);
    return 0;
  });

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to create posts');
      navigate('/auth');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Implementation would save post to database
      const sanitizedPost = {
        ...newPost,
        title: sanitizeText(newPost.title),
        content: sanitizeText(newPost.content),
        userId: user.uid,
        userName: user.displayName,
        timestamp: Date.now(),
        likes: 0,
        commentCount: 0,
      };
      
      console.log('Creating post:', sanitizedPost);
      toast.success('Post created successfully');
      setShowCreatePost(false);
      setNewPost({ title: '', content: '', sport: 'cricket', type: 'discussion' });
      refetch();
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) {
      toast.error('Please sign in to like posts');
      navigate('/auth');
      return;
    }
    // Implementation would update likes
    toast.success('Post liked');
  };

  const PostCard = ({ post }) => {
    const sportConfig = SPORTS[post.sport];
    const timeAgo = (timestamp) => {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };

    return (
      <div 
        className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
          isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
        }`}
        onClick={() => navigate(`/post/${post.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {post.userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium">{post.userName || 'Anonymous'}</p>
              <div className="flex items-center space-x-2 text-xs">
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {timeAgo(post.timestamp)}
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <span>{sportConfig?.icon || '🏏'}</span>
                  <span>{sportConfig?.name || post.sport}</span>
                </span>
              </div>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            post.type === 'news' 
              ? 'bg-red-100 text-red-600' 
              : post.type === 'analysis'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-green-100 text-green-600'
          }`}>
            {post.type}
          </span>
        </div>

        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
        <p className={`mb-3 line-clamp-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {post.content}
        </p>

        {post.image && (
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-48 object-cover rounded-lg mb-3"
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLikePost(post.id);
              }}
              className={`flex items-center space-x-1 ${
                isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likes || 0}</span>
            </button>
            <button className={`flex items-center space-x-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.commentCount || 0}</span>
            </button>
            <button className={`flex items-center space-x-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-1.519 1.523m-5.196 2.84A9.001 9.001 0 0112 21a9.001 9.001 0 01-7.197-3.553m12.394-1.192a9.001 9.001 0 00.803-2.913c0-4.97-4.03-9-9-9s-9 4.03-9 9a9.001 9.001 0 005.197 8.155" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Community - {APP_CONFIG.appName}</title>
        <meta name="description" content="Join the sports community discussion, share insights, and connect with fellow fans" />
      </Helmet>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Community</h1>
                <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Join the discussion with fellow sports enthusiasts
                </p>
              </div>
              {user && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Post</span>
                </button>
              )}
            </div>

            {/* Filters */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Sport Filter */}
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className={`px-4 py-2 rounded-lg ${
                    isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="all">All Sports</option>
                  {Object.entries(SPORTS).map(([key, sport]) => (
                    <option key={key} value={key}>
                      {sport.icon} {sport.name}
                    </option>
                  ))}
                </select>

                {/* Type Filter */}
                <div className="flex gap-2">
                  {['all', 'discussion', 'news', 'analysis'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`px-4 py-2 rounded-lg capitalize ${
                        filter === type
                          ? 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-2 rounded-lg ${
                    isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="comments">Most Comments</option>
                </select>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          {isLoading ? (
            <LoadingSpinner />
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
              <span className="text-6xl mb-4 block">💬</span>
              <p className="text-xl font-semibold mb-2">No posts yet</p>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {user ? 'Be the first to start a discussion!' : 'Sign in to join the community'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`w-full max-w-2xl p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Create Post</h2>
              <button
                onClick={() => setShowCreatePost(false)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'bg-gray-700 text-white placeholder-gray-400' 
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter post title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg resize-none ${
                    isDark 
                      ? 'bg-gray-700 text-white placeholder-gray-400' 
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                  }`}
                  rows="6"
                  placeholder="Share your thoughts..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    value={newPost.sport}
                    onChange={(e) => setNewPost({ ...newPost, sport: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    {Object.entries(SPORTS).map(([key, sport]) => (
                      <option key={key} value={key}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={newPost.type}
                    onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg ${
                      isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <option value="discussion">Discussion</option>
                    <option value="news">News</option>
                    <option value="analysis">Analysis</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className={`px-4 py-2 rounded-lg ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Community;
