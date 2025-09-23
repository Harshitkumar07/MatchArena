import { ref, onValue, off, push, set, serverTimestamp } from 'firebase/database';
import { database } from './firebase/firebaseClient';

class RealTimeSync {
  constructor() {
    this.listeners = new Map();
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    
    this.initializeConnection();
  }

  initializeConnection() {
    // Monitor connection status
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        console.log('🔥 Firebase Real-time connection established');
      } else {
        this.connectionStatus = 'disconnected';
        this.stopHeartbeat();
        console.log('❌ Firebase Real-time connection lost');
        this.attemptReconnection();
      }
    });
  }

  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      const heartbeatRef = ref(database, 'system/heartbeat');
      set(heartbeatRef, {
        timestamp: serverTimestamp(),
        status: 'alive'
      });
    }, 30000); // Send heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  attemptReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.initializeConnection();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // Subscribe to live matches across all sports
  subscribeToLiveMatches(callback) {
    const sports = ['cricket', 'football', 'basketball', 'badminton', 'tennis', 'tableTennis', 'volleyball'];
    const liveMatches = {};

    sports.forEach(sport => {
      const sportRef = ref(database, `sports/${sport}/matches`);
      
      const unsubscribe = onValue(sportRef, (snapshot) => {
        const matches = snapshot.val() || {};
        
        // Filter only live matches
        const liveOnly = Object.entries(matches)
          .filter(([_, match]) => match.status === 'live')
          .reduce((acc, [id, match]) => {
            acc[id] = { ...match, sport, id };
            return acc;
          }, {});

        liveMatches[sport] = liveOnly;
        callback(liveMatches);
      });

      this.listeners.set(`live_${sport}`, unsubscribe);
    });

    return () => {
      sports.forEach(sport => {
        const unsubscribe = this.listeners.get(`live_${sport}`);
        if (unsubscribe) {
          off(ref(database, `sports/${sport}/matches`), unsubscribe);
          this.listeners.delete(`live_${sport}`);
        }
      });
    };
  }

  // Subscribe to specific sport matches
  subscribeToSportMatches(sport, callback) {
    const sportRef = ref(database, `sports/${sport}/matches`);
    
    const unsubscribe = onValue(sportRef, (snapshot) => {
      const matches = snapshot.val() || {};
      const matchesList = Object.entries(matches).map(([id, match]) => ({
        id,
        ...match,
        sport
      }));
      
      callback(matchesList);
    });

    this.listeners.set(`sport_${sport}`, unsubscribe);
    
    return () => {
      off(sportRef, unsubscribe);
      this.listeners.delete(`sport_${sport}`);
    };
  }

  // Subscribe to specific match updates
  subscribeToMatch(sport, matchId, callback) {
    const matchRef = ref(database, `sports/${sport}/matches/${matchId}`);
    
    const unsubscribe = onValue(matchRef, (snapshot) => {
      const match = snapshot.val();
      if (match) {
        callback({ ...match, id: matchId, sport });
      }
    });

    this.listeners.set(`match_${sport}_${matchId}`, unsubscribe);
    
    return () => {
      off(matchRef, unsubscribe);
      this.listeners.delete(`match_${sport}_${matchId}`);
    };
  }

  // Subscribe to live score updates with notifications
  subscribeToLiveScores(callback) {
    const scoresRef = ref(database, 'live_scores');
    
    const unsubscribe = onValue(scoresRef, (snapshot) => {
      const scores = snapshot.val() || {};
      callback(scores);
    });

    this.listeners.set('live_scores', unsubscribe);
    
    return () => {
      off(scoresRef, unsubscribe);
      this.listeners.delete('live_scores');
    };
  }

  // Subscribe to match events (goals, wickets, etc.)
  subscribeToMatchEvents(sport, matchId, callback) {
    const eventsRef = ref(database, `sports/${sport}/matches/${matchId}/events`);
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const events = snapshot.val() || {};
      const eventsList = Object.entries(events)
        .map(([id, event]) => ({ ...event, id }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      callback(eventsList);
    });

    this.listeners.set(`events_${sport}_${matchId}`, unsubscribe);
    
    return () => {
      off(eventsRef, unsubscribe);
      this.listeners.delete(`events_${sport}_${matchId}`);
    };
  }

  // Push live score update
  pushScoreUpdate(sport, matchId, scoreData) {
    const updateRef = ref(database, `live_scores/${sport}/${matchId}`);
    return set(updateRef, {
      ...scoreData,
      timestamp: serverTimestamp(),
      sport,
      matchId
    });
  }

  // Push match event
  pushMatchEvent(sport, matchId, eventData) {
    const eventsRef = ref(database, `sports/${sport}/matches/${matchId}/events`);
    return push(eventsRef, {
      ...eventData,
      timestamp: serverTimestamp()
    });
  }

  // Get connection status
  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Clean up all listeners
  cleanup() {
    this.stopHeartbeat();
    
    this.listeners.forEach((unsubscribe, key) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    this.listeners.clear();
  }

  // Subscribe to Asian leagues specifically
  subscribeToAsianLeagues(callback) {
    const asianLeaguesRef = ref(database, 'asian_leagues');
    
    const unsubscribe = onValue(asianLeaguesRef, (snapshot) => {
      const leagues = snapshot.val() || {};
      callback(leagues);
    });

    this.listeners.set('asian_leagues', unsubscribe);
    
    return () => {
      off(asianLeaguesRef, unsubscribe);
      this.listeners.delete('asian_leagues');
    };
  }

  // Subscribe to trending matches
  subscribeToTrendingMatches(callback) {
    const trendingRef = ref(database, 'trending_matches');
    
    const unsubscribe = onValue(trendingRef, (snapshot) => {
      const trending = snapshot.val() || {};
      callback(trending);
    });

    this.listeners.set('trending_matches', unsubscribe);
    
    return () => {
      off(trendingRef, unsubscribe);
      this.listeners.delete('trending_matches');
    };
  }

  // Subscribe to user notifications
  subscribeToNotifications(userId, callback) {
    if (!userId) return () => {};
    
    const notificationsRef = ref(database, `users/${userId}/notifications`);
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const notifications = snapshot.val() || {};
      const notificationsList = Object.entries(notifications)
        .map(([id, notification]) => ({ ...notification, id }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      callback(notificationsList);
    });

    this.listeners.set(`notifications_${userId}`, unsubscribe);
    
    return () => {
      off(notificationsRef, unsubscribe);
      this.listeners.delete(`notifications_${userId}`);
    };
  }

  // Send notification
  sendNotification(userId, notificationData) {
    if (!userId) return Promise.reject('User ID required');
    
    const notificationsRef = ref(database, `users/${userId}/notifications`);
    return push(notificationsRef, {
      ...notificationData,
      timestamp: serverTimestamp(),
      read: false
    });
  }

  // Mark notification as read
  markNotificationRead(userId, notificationId) {
    if (!userId || !notificationId) return Promise.reject('User ID and Notification ID required');
    
    const notificationRef = ref(database, `users/${userId}/notifications/${notificationId}/read`);
    return set(notificationRef, true);
  }
}

// Create singleton instance
const realTimeSync = new RealTimeSync();

export default realTimeSync;

// Export specific methods for easier importing
export const {
  subscribeToLiveMatches,
  subscribeToSportMatches,
  subscribeToMatch,
  subscribeToLiveScores,
  subscribeToMatchEvents,
  subscribeToAsianLeagues,
  subscribeToTrendingMatches,
  subscribeToNotifications,
  pushScoreUpdate,
  pushMatchEvent,
  sendNotification,
  markNotificationRead,
  getConnectionStatus,
  cleanup
} = realTimeSync;
