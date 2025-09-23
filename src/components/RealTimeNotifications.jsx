import React, { useState, useEffect } from 'react';
import { Bell, X, Volume2, VolumeX, Settings, Wifi, WifiOff } from 'lucide-react';
import { useScoreNotifications, useConnectionStatus } from '../hooks/useRealTimeUpdates';

const RealTimeNotifications = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    enableSound: true,
    enableVisual: true,
    sports: ['cricket', 'football'], // Default to popular Asian sports
    position: 'top-right'
  });

  const { status: connectionStatus } = useConnectionStatus();
  const {
    notifications,
    requestNotificationPermission,
    clearNotifications,
    hasPermission
  } = useScoreNotifications(settings);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('matchArenaNotificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('matchArenaNotificationSettings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSportToggle = (sport) => {
    setSettings(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  const ConnectionIndicator = () => (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
      connectionStatus === 'connected' 
        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    }`}>
      {connectionStatus === 'connected' ? (
        <Wifi size={16} />
      ) : (
        <WifiOff size={16} />
      )}
      <span className="text-sm font-medium">
        {connectionStatus === 'connected' ? 'Live' : 'Offline'}
      </span>
    </div>
  );

  const NotificationItem = ({ notification }) => {
    const getSportIcon = (sport) => {
      const icons = {
        cricket: '🏏',
        football: '⚽',
        basketball: '🏀',
        badminton: '🏸',
        tennis: '🎾',
        tableTennis: '🏓',
        volleyball: '🏐'
      };
      return icons[sport] || '🏆';
    };

    return (
      <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <span className="text-lg">{getSportIcon(notification.sport)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Live Updates
                </h3>
                <ConnectionIndicator />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Settings Toggle */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notification Settings
                </span>
                <Settings size={16} className="text-gray-400" />
              </div>

              <div className="space-y-3">
                {/* Sound Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {settings.enableSound ? (
                      <Volume2 size={16} className="text-green-600" />
                    ) : (
                      <VolumeX size={16} className="text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-300">Sound</span>
                  </div>
                  <button
                    onClick={() => handleSettingChange('enableSound', !settings.enableSound)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.enableSound ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings.enableSound ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Visual Notifications */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Browser Alerts</span>
                  <button
                    onClick={() => {
                      if (!hasPermission) {
                        requestNotificationPermission();
                      }
                      handleSettingChange('enableVisual', !settings.enableVisual);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.enableVisual && hasPermission ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings.enableVisual && hasPermission ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sports Selection */}
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-300 mb-2 block">
                    Sports to Follow
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['cricket', 'football', 'basketball', 'badminton'].map(sport => (
                      <button
                        key={sport}
                        onClick={() => handleSportToggle(sport)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          settings.sports.includes(sport)
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="p-4 space-y-3">
                  {notifications.map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                  <button
                    onClick={clearNotifications}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2"
                  >
                    Clear All
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No live updates yet</p>
                  <p className="text-xs mt-1">
                    You'll see score updates here when matches are live
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Updates every few seconds • Asian leagues prioritized
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Notifications */}
      <div className={`fixed z-50 space-y-2 ${
        settings.position === 'top-right' ? 'top-4 right-4' :
        settings.position === 'top-left' ? 'top-4 left-4' :
        settings.position === 'bottom-right' ? 'bottom-4 right-4' :
        'bottom-4 left-4'
      }`}>
        {notifications.slice(0, 3).map(notification => (
          <div
            key={notification.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm animate-slide-in"
          >
            <div className="flex items-start space-x-3">
              <span className="text-lg">
                {notification.sport === 'cricket' ? '🏏' :
                 notification.sport === 'football' ? '⚽' :
                 notification.sport === 'basketball' ? '🏀' : '🏆'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {notification.sport.charAt(0).toUpperCase() + notification.sport.slice(1)} • Just now
                </p>
              </div>
              <button
                onClick={() => {
                  // Remove this specific notification
                  // This would be handled by the parent component
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default RealTimeNotifications;
