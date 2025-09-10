import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useRealtimeDatabase';
import { useTheme } from '../contexts/ThemeContext';
import { updateData } from '../services/firebase/database';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const { notifications, unreadCount, loading } = useNotifications(currentUser?.uid);

  const markAsRead = async (notificationId) => {
    if (!currentUser) return;
    await updateData(`notifications/${currentUser.uid}/${notificationId}`, { read: true });
  };

  const markAllAsRead = async () => {
    if (!currentUser || !notifications) return;
    const updates = {};
    Object.keys(notifications).forEach(id => {
      if (!notifications[id].read) {
        updates[`notifications/${currentUser.uid}/${id}/read`] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      await updateData('/', updates);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return '💬';
      case 'vote':
        return '👍';
      case 'report':
        return '⚠️';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'comment':
        return `Someone commented on your post`;
      case 'vote':
        return `Your post received a vote`;
      case 'report':
        return `Content has been reported`;
      case 'system':
        return notification.data?.message || 'System notification';
      default:
        return 'New notification';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5 z-50`}>
          <div className={`flex justify-between items-center px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : notifications && Object.keys(notifications).length > 0 ? (
              Object.entries(notifications)
                .sort(([, a], [, b]) => b.createdAt - a.createdAt)
                .slice(0, 10)
                .map(([id, notification]) => (
                  <div
                    key={id}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-gray-700' : ''
                    }`}
                    onClick={() => {
                      markAsRead(id);
                      setDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                          {getNotificationMessage(notification)}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No notifications yet
                </p>
              </div>
            )}
          </div>

          <Link
            to="/notifications"
            className={`block px-4 py-3 text-center text-sm text-blue-500 hover:text-blue-600 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
            onClick={() => setDropdownOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
