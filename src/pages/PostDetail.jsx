import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRealtimeDatabase } from '../hooks/useRealtimeDatabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { APP_CONFIG, SPORTS } from '../config/routes';
import { sanitizeText } from '../utils/sanitize';
import toast from 'react-hot-toast';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  // Fetch post details
  const { data: post, isLoading: postLoading } = useRealtimeDatabase(
    `community/posts/${postId}`
  );

  // Fetch comments
  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useRealtimeDatabase(
    `community/posts/${postId}/comments`,
    {
      orderBy: 'timestamp',
    }
  );

  const handleLikePost = async () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      navigate('/auth');
      return;
    }
    // Implementation would update likes
    toast.success('Post liked');
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
      const sanitizedComment = sanitizeText(comment);
      // Implementation would save comment to database
      console.log('Adding comment:', {
        text: sanitizedComment,
        userId: user.uid,
        userName: user.displayName,
        timestamp: Date.now(),
        replyTo: replyTo?.id || null,
      });
      
      setComment('');
      setReplyTo(null);
      toast.success('Comment posted');
      refetchComments();
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        // Implementation would delete post
        toast.success('Post deleted');
        navigate('/community');
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  if (postLoading) {
    return <LoadingSpinner />;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Post not found</p>
          <button
            onClick={() => navigate('/community')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  const sportConfig = SPORTS[post.sport];
  const isAuthor = user?.uid === post.userId;
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
    <>
      <Helmet>
        <title>{post.title} - {APP_CONFIG.appName}</title>
        <meta name="description" content={post.content.substring(0, 160)} />
      </Helmet>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/community')}
            className={`mb-4 px-4 py-2 rounded-lg ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ← Back to Community
          </button>

          {/* Post Content */}
          <article className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}>
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {post.userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium">{post.userName || 'Anonymous'}</p>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {timeAgo(post.timestamp)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <span>{sportConfig?.icon || '🏏'}</span>
                      <span>{sportConfig?.name || post.sport}</span>
                    </span>
                    <span>•</span>
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
                </div>
              </div>
              {isAuthor && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/post/${postId}/edit`)}
                    className={`p-2 rounded-lg ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className={`p-2 rounded-lg text-red-500 ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Post Title & Content */}
            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
              <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {post.content}
              </p>
            </div>

            {post.image && (
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full rounded-lg mt-4"
              />
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLikePost}
                  className={`flex items-center space-x-2 ${
                    isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likes || 0} likes</span>
                </button>
                <span className={`flex items-center space-x-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{comments?.length || 0} comments</span>
                </span>
              </div>
              <button className={`flex items-center space-x-2 ${
                isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-500'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-1.519 1.523m-5.196 2.84A9.001 9.001 0 0112 21a9.001 9.001 0 01-7.197-3.553m12.394-1.192a9.001 9.001 0 00.803-2.913c0-4.97-4.03-9-9-9s-9 4.03-9 9a9.001 9.001 0 005.197 8.155" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          </article>

          {/* Comments Section */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className="text-xl font-semibold mb-4">Comments</h2>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                {replyTo && (
                  <div className={`mb-2 p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        Replying to <strong>{replyTo.userName}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        className="text-sm text-red-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={replyTo ? "Write a reply..." : "Share your thoughts..."}
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
                    {replyTo ? 'Post Reply' : 'Post Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className={`text-center py-4 mb-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="mb-2">Sign in to join the discussion</p>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Sign In
                </button>
              </div>
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{c.userName || 'Anonymous'}</p>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {timeAgo(c.timestamp)}
                            </span>
                          </div>
                          {user && (
                            <button
                              onClick={() => setReplyTo(c)}
                              className="text-sm text-blue-500 hover:text-blue-600"
                            >
                              Reply
                            </button>
                          )}
                        </div>
                        {c.replyTo && (
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            @{c.replyTo}
                          </p>
                        )}
                        <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {c.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PostDetail;
