import { 
  ref, 
  push, 
  set, 
  get, 
  query, 
  orderByChild, 
  orderByKey, 
  orderByValue,
  limitToLast, 
  limitToFirst, 
  startAt, 
  endAt, 
  equalTo, 
  onValue,
  update,
  remove,
  child,
  onDisconnect,
  serverTimestamp, 
  increment, 
  runTransaction
} from 'firebase/database';
import { database } from './firebaseClient';

/**
 * Database utility functions for Firebase Realtime Database
 */

// Read Operations
export const readOnce = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error(`Error reading from ${path}:`, error);
    throw error;
  }
};

export const listen = (path, callback, errorCallback = console.error) => {
  const dbRef = ref(database, path);
  const unsubscribe = onValue(
    dbRef,
    (snapshot) => {
      callback(snapshot.val(), snapshot);
    },
    errorCallback
  );
  return unsubscribe;
};

// Write Operations
export const write = async (path, data) => {
  try {
    await set(ref(database, path), data);
    return { success: true };
  } catch (error) {
    console.error(`Error writing to ${path}:`, error);
    throw error;
  }
};

export const updateData = async (path, updates) => {
  try {
    await update(ref(database, path), updates);
    return { success: true };
  } catch (error) {
    console.error(`Error updating ${path}:`, error);
    throw error;
  }
};

export const pushData = async (path, data) => {
  try {
    const newRef = push(ref(database, path));
    await set(newRef, data);
    return { success: true, key: newRef.key };
  } catch (error) {
    console.error(`Error pushing to ${path}:`, error);
    throw error;
  }
};

export const removeData = async (path) => {
  try {
    await remove(ref(database, path));
    return { success: true };
  } catch (error) {
    console.error(`Error removing ${path}:`, error);
    throw error;
  }
};

// Transaction Operations
export const runDatabaseTransaction = async (path, updateFunction) => {
  try {
    const result = await runTransaction(ref(database, path), updateFunction);
    return result;
  } catch (error) {
    console.error(`Error in transaction at ${path}:`, error);
    throw error;
  }
};

// Query Builders
export const createQuery = (path, options = {}) => {
  let dbQuery = ref(database, path);

  if (options.orderBy) {
    switch (options.orderBy.type) {
      case 'child':
        dbQuery = query(dbQuery, orderByChild(options.orderBy.path));
        break;
      case 'key':
        dbQuery = query(dbQuery, orderByKey());
        break;
      case 'value':
        dbQuery = query(dbQuery, orderByValue());
        break;
      default:
        break;
    }
  }

  if (options.limitToFirst) {
    dbQuery = query(dbQuery, limitToFirst(options.limitToFirst));
  }

  if (options.limitToLast) {
    dbQuery = query(dbQuery, limitToLast(options.limitToLast));
  }

  if (options.startAt !== undefined) {
    dbQuery = query(dbQuery, startAt(options.startAt));
  }

  if (options.endAt !== undefined) {
    dbQuery = query(dbQuery, endAt(options.endAt));
  }

  if (options.equalTo !== undefined) {
    dbQuery = query(dbQuery, equalTo(options.equalTo));
  }

  return dbQuery;
};

export const listenToQuery = (path, options, callback, errorCallback = console.error) => {
  const dbQuery = createQuery(path, options);
  const unsubscribe = onValue(
    dbQuery,
    (snapshot) => {
      const data = [];
      snapshot.forEach((childSnapshot) => {
        data.push({
          key: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(data, snapshot);
    },
    errorCallback
  );
  return unsubscribe;
};

// Presence System
export const setupPresence = (userId) => {
  const userStatusRef = ref(database, `status/${userId}`);
  const isOfflineForDatabase = {
    state: 'offline',
    lastSeen: serverTimestamp(),
  };

  const isOnlineForDatabase = {
    state: 'online',
    lastSeen: serverTimestamp(),
  };

  // Set online status when connected
  const connectedRef = ref(database, '.info/connected');
  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === false) {
      return;
    }

    onDisconnect(userStatusRef)
      .set(isOfflineForDatabase)
      .then(() => {
        set(userStatusRef, isOnlineForDatabase);
      });
  });
};

// Helper Functions
export const getRef = (path) => ref(database, path);

export const getChild = (parentRef, path) => child(parentRef, path);

export const getServerTimestamp = () => serverTimestamp();

export const getIncrement = (value) => increment(value);

// Batch Operations
export const batchUpdate = async (updates) => {
  try {
    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
};

// Offline Support
export const goOffline = async () => {
  const { goOffline: dbGoOffline } = await import('firebase/database');
  dbGoOffline(database);
};

export const goOnline = async () => {
  const { goOnline: dbGoOnline } = await import('firebase/database');
  dbGoOnline(database);
};

// Export database instance for direct usage
export { database };
