import { useState, useEffect, useCallback, useRef } from 'react';
import realTimeSync from '../services/realTimeSync';

// Custom hook for real-time live matches
export const useLiveMatches = () => {
  const [liveMatches, setLiveMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = realTimeSync.subscribeToLiveMatches((matches) => {
      setLiveMatches(matches);
      setLoading(false);
      setError(null);
    });

    // Monitor connection status
    const statusInterval = setInterval(() => {
      setConnectionStatus(realTimeSync.getConnectionStatus());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, []);

  return { liveMatches, loading, error, connectionStatus };
};

// Custom hook for specific sport matches
export const useSportMatches = (sport) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sport) return;

    setLoading(true);
    
    const unsubscribe = realTimeSync.subscribeToSportMatches(sport, (matchesList) => {
      setMatches(matchesList);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, [sport]);

  return { matches, loading, error };
};

// Custom hook for specific match updates
export const useMatchUpdates = (sport, matchId) => {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sport || !matchId) return;

    setLoading(true);
    
    const unsubscribe = realTimeSync.subscribeToMatch(sport, matchId, (matchData) => {
      setMatch(matchData);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, [sport, matchId]);

  return { match, loading, error };
};

// Custom hook for match events
export const useMatchEvents = (sport, matchId) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState(null);

  useEffect(() => {
    if (!sport || !matchId) return;

    setLoading(true);
    
    const unsubscribe = realTimeSync.subscribeToMatchEvents(sport, matchId, (eventsList) => {
      // Check for new events
      if (events.length > 0 && eventsList.length > events.length) {
        const latestEvent = eventsList[0];
        setNewEvent(latestEvent);
        
        // Clear new event notification after 5 seconds
        setTimeout(() => setNewEvent(null), 5000);
      }
      
      setEvents(eventsList);
      setLoading(false);
    });

    return unsubscribe;
  }, [sport, matchId]);

  return { events, loading, newEvent };
};

// Custom hook for live scores with notifications
export const useLiveScores = () => {
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [scoreUpdates, setScoreUpdates] = useState([]);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = realTimeSync.subscribeToLiveScores((scoresData) => {
      // Track score changes for notifications
      if (Object.keys(scores).length > 0) {
        const updates = [];
        
        Object.entries(scoresData).forEach(([sport, sportScores]) => {
          Object.entries(sportScores || {}).forEach(([matchId, scoreData]) => {
            const previousScore = scores[sport]?.[matchId];
            if (previousScore && JSON.stringify(previousScore) !== JSON.stringify(scoreData)) {
              updates.push({
                sport,
                matchId,
                scoreData,
                timestamp: Date.now()
              });
            }
          });
        });
        
        if (updates.length > 0) {
          setScoreUpdates(prev => [...updates, ...prev].slice(0, 10)); // Keep last 10 updates
        }
      }
      
      setScores(scoresData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { scores, loading, scoreUpdates };
};

// Custom hook for Asian leagues
export const useAsianLeagues = () => {
  const [leagues, setLeagues] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = realTimeSync.subscribeToAsianLeagues((leaguesData) => {
      setLeagues(leaguesData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { leagues, loading };
};

// Custom hook for trending matches
export const useTrendingMatches = () => {
  const [trending, setTrending] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = realTimeSync.subscribeToTrendingMatches((trendingData) => {
      setTrending(trendingData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { trending, loading };
};

// Custom hook for user notifications
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = realTimeSync.subscribeToNotifications(userId, (notificationsList) => {
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const markAsRead = useCallback((notificationId) => {
    if (userId && notificationId) {
      realTimeSync.markNotificationRead(userId, notificationId);
    }
  }, [userId]);

  return { notifications, loading, unreadCount, markAsRead };
};

// Custom hook for real-time connection status
export const useConnectionStatus = () => {
  const [status, setStatus] = useState('disconnected');
  const [lastConnected, setLastConnected] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = realTimeSync.getConnectionStatus();
      setStatus(currentStatus);
      
      if (currentStatus === 'connected') {
        setLastConnected(new Date());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { status, lastConnected };
};

// Custom hook for score notifications with sound/visual alerts
export const useScoreNotifications = (options = {}) => {
  const { enableSound = true, enableVisual = true, sports = [] } = options;
  const [notifications, setNotifications] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    if (enableSound) {
      audioRef.current = new Audio('/notification-sound.mp3');
      audioRef.current.volume = 0.3;
    }
  }, [enableSound]);

  const { scoreUpdates } = useLiveScores();

  useEffect(() => {
    if (scoreUpdates.length > 0) {
      const latestUpdate = scoreUpdates[0];
      
      // Filter by selected sports if specified
      if (sports.length === 0 || sports.includes(latestUpdate.sport)) {
        // Add to notifications
        const notification = {
          id: `${latestUpdate.sport}_${latestUpdate.matchId}_${latestUpdate.timestamp}`,
          type: 'score_update',
          sport: latestUpdate.sport,
          matchId: latestUpdate.matchId,
          message: `Score updated in ${latestUpdate.sport} match`,
          timestamp: latestUpdate.timestamp,
          data: latestUpdate.scoreData
        };

        setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5

        // Play sound notification
        if (enableSound && audioRef.current) {
          audioRef.current.play().catch(console.error);
        }

        // Show browser notification if supported and enabled
        if (enableVisual && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(`MatchArena - ${latestUpdate.sport}`, {
            body: `Score updated in live match`,
            icon: '/logo192.png',
            tag: latestUpdate.matchId
          });
        }

        // Auto-remove notification after 10 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 10000);
      }
    }
  }, [scoreUpdates, sports, enableSound, enableVisual]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    requestNotificationPermission,
    clearNotifications,
    hasPermission: 'Notification' in window && Notification.permission === 'granted'
  };
};

// Custom hook for match predictions and analytics
export const useMatchAnalytics = (sport, matchId) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sport || !matchId) return;

    // Mock analytics data - in real implementation, this would come from Firebase
    setTimeout(() => {
      setAnalytics({
        winProbability: {
          home: Math.random() * 100,
          away: Math.random() * 100
        },
        keyStats: {
          possession: Math.random() * 100,
          shots: Math.floor(Math.random() * 20),
          corners: Math.floor(Math.random() * 10)
        },
        momentum: Math.random() * 100 - 50, // -50 to +50
        predictions: {
          nextGoal: Math.random() > 0.5 ? 'home' : 'away',
          finalScore: `${Math.floor(Math.random() * 4)}-${Math.floor(Math.random() * 4)}`
        }
      });
      setLoading(false);
    }, 1000);
  }, [sport, matchId]);

  return { analytics, loading };
};

export default {
  useLiveMatches,
  useSportMatches,
  useMatchUpdates,
  useMatchEvents,
  useLiveScores,
  useAsianLeagues,
  useTrendingMatches,
  useNotifications,
  useConnectionStatus,
  useScoreNotifications,
  useMatchAnalytics
};
