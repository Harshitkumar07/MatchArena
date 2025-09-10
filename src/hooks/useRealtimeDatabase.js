import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  listen, 
  listenToQuery, 
  write, 
  updateData, 
  pushData, 
  removeData,
  runDatabaseTransaction 
} from '../services/firebase/database';

/**
 * Custom hook for real-time database subscriptions
 */
export const useRealtimeData = (path, queryOptions = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData = (snapshot) => {
      setData(snapshot);
      setLoading(false);
      setError(null);
    };

    const handleError = (err) => {
      console.error(`Error listening to ${path}:`, err);
      setError(err);
      setLoading(false);
    };

    // Use query listener if options provided, otherwise use simple listener
    if (Object.keys(queryOptions).length > 0) {
      unsubscribeRef.current = listenToQuery(path, queryOptions, handleData, handleError);
    } else {
      unsubscribeRef.current = listen(path, handleData, handleError);
    }

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [path, JSON.stringify(queryOptions)]);

  return { data, loading, error };
};

/**
 * Custom hook for real-time database with React Query integration
 */
export const useRtdbQuery = (queryKey, path, options = {}) => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!path || isSubscribed) return;

    const handleData = (data) => {
      queryClient.setQueryData(queryKey, data);
    };

    const handleError = (error) => {
      queryClient.setQueryData(queryKey, null);
      console.error(`RTDB Query error for ${path}:`, error);
    };

    unsubscribeRef.current = listen(path, handleData, handleError);
    setIsSubscribed(true);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        setIsSubscribed(false);
      }
    };
  }, [path, queryKey, queryClient, isSubscribed]);

  const data = queryClient.getQueryData(queryKey);
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { data, invalidate, isSubscribed };
};

/**
 * Custom hook for database mutations with optimistic updates
 */
export const useRealtimeMutation = (path, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const mutate = useCallback(async (data, mutationOptions = {}) => {
    setLoading(true);
    setError(null);

    const { 
      optimisticUpdate, 
      queryKey, 
      onSuccess, 
      onError,
      type = 'write' 
    } = { ...options, ...mutationOptions };

    // Optimistic update
    let previousData = null;
    if (optimisticUpdate && queryKey) {
      previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, optimisticUpdate(previousData));
    }

    try {
      let result;
      switch (type) {
        case 'update':
          result = await updateData(path, data);
          break;
        case 'push':
          result = await pushData(path, data);
          break;
        case 'remove':
          result = await removeData(path);
          break;
        case 'transaction':
          result = await runDatabaseTransaction(path, data);
          break;
        default:
          result = await write(path, data);
      }

      setLoading(false);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err);
      setLoading(false);

      // Rollback optimistic update on error
      if (optimisticUpdate && queryKey && previousData !== null) {
        queryClient.setQueryData(queryKey, previousData);
      }

      if (onError) onError(err);
      throw err;
    }
  }, [path, options, queryClient]);

  return { mutate, loading, error };
};

/**
 * Custom hook for live match subscription
 */
export const useLiveMatches = (sport) => {
  const path = sport ? `matches/${sport}` : null;
  const queryOptions = {
    orderBy: { type: 'child', path: 'status' },
    equalTo: 'live'
  };

  return useRealtimeData(path, queryOptions);
};

/**
 * Custom hook for match detail subscription
 */
export const useMatchDetail = (sport, matchId) => {
  const path = sport && matchId ? `matches/${sport}/${matchId}` : null;
  return useRealtimeData(path);
};

/**
 * Custom hook for series subscription
 */
export const useSeries = (sport) => {
  const path = sport ? `series/${sport}` : null;
  const queryOptions = {
    orderBy: { type: 'child', path: 'startsAt' },
    limitToLast: 20
  };

  return useRealtimeData(path, queryOptions);
};

/**
 * Custom hook for community posts
 */
export const useCommunityPosts = (sport, options = {}) => {
  const path = sport ? `communities/${sport}/posts` : null;
  const { sortBy = 'createdAt', limit = 20 } = options;

  const queryOptions = {
    orderBy: { type: 'child', path: sortBy },
    limitToLast: limit
  };

  return useRealtimeData(path, queryOptions);
};

/**
 * Custom hook for post comments
 */
export const useComments = (sport, postId) => {
  const path = sport && postId ? `communities/${sport}/comments` : null;
  const queryOptions = {
    orderBy: { type: 'child', path: 'postId' },
    equalTo: postId
  };

  return useRealtimeData(path, queryOptions);
};

/**
 * Custom hook for user notifications
 */
export const useNotifications = (userId) => {
  const path = userId ? `notifications/${userId}` : null;
  const queryOptions = {
    orderBy: { type: 'child', path: 'createdAt' },
    limitToLast: 50
  };

  const { data, loading, error } = useRealtimeData(path, queryOptions);

  // Count unread notifications
  const unreadCount = data ? Object.values(data).filter(n => !n.read).length : 0;

  return { notifications: data, unreadCount, loading, error };
};

/**
 * Custom hook for presence system
 */
export const usePresence = (userId) => {
  const [isOnline, setIsOnline] = useState(false);
  const path = userId ? `status/${userId}` : null;

  useEffect(() => {
    if (!path) return;

    const unsubscribe = listen(path, (data) => {
      setIsOnline(data?.state === 'online');
    });

    return unsubscribe;
  }, [path]);

  return isOnline;
};

/**
 * Custom hook for voting system
 */
export const useVoting = (sport, postId, userId) => {
  const votePath = `communities/${sport}/votes/${postId}/${userId}`;
  const postPath = `communities/${sport}/posts/${postId}/votes`;
  
  const { data: userVote } = useRealtimeData(votePath);
  const { mutate: castVote, loading } = useRealtimeMutation(votePath);
  
  const vote = useCallback(async (value) => {
    if (!userId) {
      throw new Error('Must be logged in to vote');
    }

    // Update user's vote
    await castVote(value);

    // Update post vote count (should be done via transaction in production)
    await runDatabaseTransaction(postPath, (currentVotes) => {
      const votes = currentVotes || 0;
      if (userVote === value) {
        // Removing vote
        return votes - value;
      } else if (userVote) {
        // Changing vote
        return votes - userVote + value;
      } else {
        // New vote
        return votes + value;
      }
    });
  }, [userId, userVote, castVote, postPath]);

  return { userVote, vote, loading };
};

export default {
  useRealtimeData,
  useRtdbQuery,
  useRealtimeMutation,
  useLiveMatches,
  useMatchDetail,
  useSeries,
  useCommunityPosts,
  useComments,
  useNotifications,
  usePresence,
  useVoting
};
