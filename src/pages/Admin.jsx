import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRealtimeDatabase } from '../hooks/useRealtimeDatabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { APP_CONFIG } from '../config/routes';
import toast from 'react-hot-toast';

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  // Fetch dashboard data
  const { data: stats } = useRealtimeDatabase('admin/stats');
  const { data: reportedPosts, isLoading: postsLoading } = useRealtimeDatabase(
    'admin/reported/posts',
    { orderBy: 'timestamp', limitToLast: 50 }
  );
  const { data: users, isLoading: usersLoading } = useRealtimeDatabase(
    'admin/users',
    { orderBy: 'createdAt', limitToLast: 100 }
  );
  const { data: systemLogs } = useRealtimeDatabase(
    'admin/logs',
    { orderBy: 'timestamp', limitToLast: 50 }
  );

  const handleBulkAction = async (action, type) => {
    const items = type === 'posts' ? selectedPosts : selectedUsers;
    if (items.length === 0) {
      toast.error(`No ${type} selected`);
      return;
    }

    if (window.confirm(`Are you sure you want to ${action} ${items.length} ${type}?`)) {
      try {
        // Implementation would handle bulk actions
        console.log(`${action} ${type}:`, items);
        toast.success(`${items.length} ${type} ${action}ed successfully`);
        type === 'posts' ? setSelectedPosts([]) : setSelectedUsers([]);
      } catch (error) {
        toast.error(`Failed to ${action} ${type}`);
      }
    }
  };

  const handleModeratePost = async (postId, action) => {
    try {
      // Implementation would moderate post
      console.log(`${action} post:`, postId);
      toast.success(`Post ${action}ed`);
    } catch (error) {
      toast.error(`Failed to ${action} post`);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      // Implementation would handle user action
      console.log(`${action} user:`, userId);
      toast.success(`User ${action}ed`);
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  if (!user || !isAdmin) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - {APP_CONFIG.appName}</title>
        <meta name="description" content="Admin dashboard for managing content and users" />
      </Helmet>

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage content, users, and system settings
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-green-500">+{stats?.newUsersToday || 0} today</p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Posts</p>
              <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
              <p className="text-sm text-green-500">+{stats?.newPostsToday || 0} today</p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Matches</p>
              <p className="text-2xl font-bold">{stats?.activeMatches || 0}</p>
              <p className="text-sm text-blue-500">{stats?.liveMatches || 0} live</p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Reports</p>
              <p className="text-2xl font-bold text-red-500">{stats?.pendingReports || 0}</p>
              <p className="text-sm">Pending review</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-4 border-b">
              {['overview', 'content', 'users', 'reports', 'logs'].map((tab) => (
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
                  {tab === 'reports' && stats?.pendingReports > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                      {stats.pendingReports}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {systemLogs?.slice(0, 5).map((log, index) => (
                        <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{log.action}</span>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {log.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className={`w-full text-left p-3 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        📝 Create Announcement
                      </button>
                      <button className={`w-full text-left p-3 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        🔄 Sync Match Data
                      </button>
                      <button className={`w-full text-left p-3 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        📊 Generate Reports
                      </button>
                      <button className={`w-full text-left p-3 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        ⚙️ System Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Content Moderation</h3>
                  {selectedPosts.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkAction('approve', 'posts')}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Approve Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete', 'posts')}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete Selected
                      </button>
                    </div>
                  )}
                </div>

                {postsLoading ? (
                  <LoadingSpinner />
                ) : reportedPosts && reportedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {reportedPosts.map((post) => (
                      <div key={post.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedPosts.includes(post.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPosts([...selectedPosts, post.id]);
                                } else {
                                  setSelectedPosts(selectedPosts.filter(id => id !== post.id));
                                }
                              }}
                              className="mt-1"
                            />
                            <div>
                              <p className="font-medium">{post.title}</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                By {post.userName} • {new Date(post.timestamp).toLocaleString()}
                              </p>
                              <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {post.content.substring(0, 200)}...
                              </p>
                              <div className="mt-2">
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                  {post.reportCount} reports
                                </span>
                                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded ml-2">
                                  {post.reportReason}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleModeratePost(post.id, 'approve')}
                              className="text-green-500 hover:text-green-600"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleModeratePost(post.id, 'delete')}
                              className="text-red-500 hover:text-red-600"
                            >
                              ✗
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No content requiring moderation
                  </p>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">User Management</h3>
                  {selectedUsers.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkAction('ban', 'users')}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Ban Selected
                      </button>
                    </div>
                  )}
                </div>

                {usersLoading ? (
                  <LoadingSpinner />
                ) : users && users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(users.map(u => u.id));
                                } else {
                                  setSelectedUsers([]);
                                }
                              }}
                            />
                          </th>
                          <th className="px-4 py-3 text-left">User</th>
                          <th className="px-4 py-3 text-left">Email</th>
                          <th className="px-4 py-3 text-left">Joined</th>
                          <th className="px-4 py-3 text-left">Posts</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(u.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, u.id]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 font-medium">{u.displayName}</td>
                            <td className="px-4 py-3">{u.email}</td>
                            <td className="px-4 py-3">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">{u.postCount || 0}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                u.status === 'active' 
                                  ? 'bg-green-100 text-green-600'
                                  : u.status === 'banned'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => navigate(`/profile/${u.id}`)}
                                  className="text-blue-500 hover:text-blue-600"
                                >
                                  View
                                </button>
                                {u.status === 'active' ? (
                                  <button
                                    onClick={() => handleUserAction(u.id, 'ban')}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    Ban
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUserAction(u.id, 'unban')}
                                    className="text-green-500 hover:text-green-600"
                                  >
                                    Unban
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No users found
                  </p>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Reports Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Report Types</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Spam</span>
                        <span className="font-semibold">{stats?.reportTypes?.spam || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inappropriate Content</span>
                        <span className="font-semibold">{stats?.reportTypes?.inappropriate || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Harassment</span>
                        <span className="font-semibold">{stats?.reportTypes?.harassment || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>False Information</span>
                        <span className="font-semibold">{stats?.reportTypes?.false || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Recent Reports</h4>
                    <div className="space-y-3">
                      {reportedPosts?.slice(0, 5).map((report) => (
                        <div key={report.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className="text-sm font-medium">{report.title}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {report.reportCount} reports • {report.reportReason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">System Logs</h3>
                <div className="space-y-3">
                  {systemLogs?.map((log, index) => (
                    <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            log.level === 'error' 
                              ? 'bg-red-100 text-red-600'
                              : log.level === 'warning'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {log.level}
                          </span>
                          <span className="font-medium">{log.action}</span>
                        </div>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {log.details}
                      </p>
                      {log.user && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          User: {log.user}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
