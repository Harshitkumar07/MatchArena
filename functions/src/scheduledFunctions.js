const functions = require('firebase-functions');
const admin = require('firebase-admin');
const CricketDataService = require('./services/cricketDataService');
const FootballApiService = require('./services/footballApiService');
const MultiSportService = require('./services/multiSportService');
const logger = require('./utils/logger');

// Initialize services
const cricketService = new CricketDataService();
const footballService = new FootballApiService();
const multiSportService = new MultiSportService();

// Sync cricket data every 2 minutes for live matches
exports.syncCricketData = functions.pubsub
  .schedule('every 2 minutes')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      logger.info('Starting cricket data sync...');
      const db = admin.database();
      
      // Get current matches
      const currentMatches = await cricketService.getCurrentMatches();
      logger.info(`Found ${currentMatches.length} cricket matches`);
      
      // Process each match
      for (const match of currentMatches) {
        const matchRef = db.ref(`sports/cricket/matches/${match.id}`);
        
        // Update basic match data
        await matchRef.set({
          ...match,
          lastSyncAt: Date.now()
        });
        
        // If match is live, get detailed live data
        if (match.status === 'live') {
          try {
            const liveScore = await cricketService.getLiveScore(match.id);
            if (liveScore) {
              await matchRef.child('liveData').set(liveScore);
              logger.info(`Updated live data for match ${match.id}`);
            }
          } catch (liveError) {
            logger.warn(`Failed to get live data for match ${match.id}:`, liveError.message);
          }
        }
      }
      
      // Sync series data (less frequently)
      if (context.timestamp % 6 === 0) { // Every 12 minutes
        const series = await cricketService.getSeries();
        for (const s of series) {
          await db.ref(`sports/cricket/series/${s.id}`).set({
            ...s,
            lastSyncAt: Date.now()
          });
        }
        logger.info(`Synced ${series.length} cricket series`);
      }
      
      logger.info('Cricket data sync completed successfully');
      return { success: true, matchesCount: currentMatches.length };
    } catch (error) {
      logger.error('Error in cricket data sync:', error);
      throw error;
    }
  });

// Sync football data every 1 minute for live matches
exports.syncFootballData = functions.pubsub
  .schedule('every 1 minutes')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      logger.info('Starting football data sync...');
      const db = admin.database();
      
      // Get live matches first (highest priority)
      const liveMatches = await footballService.getLiveMatches();
      logger.info(`Found ${liveMatches.length} live football matches`);
      
      // Process live matches with detailed data
      for (const match of liveMatches) {
        const matchRef = db.ref(`sports/football/matches/${match.id}`);
        
        // Get detailed match data for live matches
        try {
          const detailedMatch = await footballService.getMatchDetail(match.id);
          if (detailedMatch) {
            await matchRef.set({
              ...detailedMatch,
              lastSyncAt: Date.now()
            });
            logger.info(`Updated live match ${match.id} with detailed data`);
          }
        } catch (detailError) {
          // Fallback to basic match data
          await matchRef.set({
            ...match,
            lastSyncAt: Date.now()
          });
          logger.warn(`Used basic data for match ${match.id}:`, detailError.message);
        }
      }
      
      // Get today's fixtures (every 5 minutes)
      if (context.timestamp % 5 === 0) {
        const todayFixtures = await footballService.getTodayFixtures();
        for (const match of todayFixtures) {
          if (match.status !== 'live') { // Don't overwrite live matches
            await db.ref(`sports/football/matches/${match.id}`).set({
              ...match,
              lastSyncAt: Date.now()
            });
          }
        }
        logger.info(`Synced ${todayFixtures.length} today's football fixtures`);
      }
      
      // Update league standings (every 30 minutes)
      if (context.timestamp % 30 === 0) {
        const asianLeagues = Object.keys(footballService.asianLeagues);
        for (const leagueId of asianLeagues.slice(0, 3)) { // Limit to 3 leagues per run
          try {
            const standings = await footballService.getLeagueStandings(leagueId);
            if (standings.length > 0) {
              await db.ref(`sports/football/leagues/${leagueId}/standings`).set({
                data: standings,
                lastSyncAt: Date.now()
              });
            }
          } catch (standingsError) {
            logger.warn(`Failed to sync standings for league ${leagueId}:`, standingsError.message);
          }
        }
      }
      
      logger.info('Football data sync completed successfully');
      return { success: true, liveMatchesCount: liveMatches.length };
    } catch (error) {
      logger.error('Error in football data sync:', error);
      throw error;
    }
  });

// Sync multi-sport data every 5 minutes
exports.syncMultiSportData = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      logger.info('Starting multi-sport data sync...');
      const db = admin.database();
      
      // Get all sports data
      const allSportsData = await multiSportService.getAllSportsData();
      
      // Sync basketball data
      if (allSportsData.basketball.length > 0) {
        for (const game of allSportsData.basketball) {
          await db.ref(`sports/basketball/games/${game.id}`).set({
            ...game,
            lastSyncAt: Date.now()
          });
        }
        logger.info(`Synced ${allSportsData.basketball.length} basketball games`);
      }
      
      // Sync other sports (mock data for now)
      const sportsToSync = ['tennis', 'badminton', 'tableTennis', 'volleyball'];
      for (const sport of sportsToSync) {
        const sportData = allSportsData[sport];
        if (sportData.length > 0) {
          for (const match of sportData) {
            await db.ref(`sports/${sport}/matches/${match.id}`).set({
              ...match,
              lastSyncAt: Date.now()
            });
          }
          logger.info(`Synced ${sportData.length} ${sport} matches`);
        }
      }
      
      logger.info('Multi-sport data sync completed successfully');
      return { success: true, sportsData: allSportsData };
    } catch (error) {
      logger.error('Error in multi-sport data sync:', error);
      throw error;
    }
  });

// Daily cleanup and maintenance
exports.dailyMaintenance = functions.pubsub
  .schedule('0 2 * * *') // 2 AM daily
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      logger.info('Starting daily maintenance...');
      const db = admin.database();
      
      // Clean up old match data (older than 7 days)
      const cutoffDate = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const sports = ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'tableTennis', 'volleyball'];
      
      for (const sport of sports) {
        const matchesRef = db.ref(`sports/${sport}/matches`);
        const snapshot = await matchesRef.once('value');
        const matches = snapshot.val() || {};
        
        let cleanedCount = 0;
        for (const [matchId, match] of Object.entries(matches)) {
          if (match.startsAt < cutoffDate && match.status === 'completed') {
            // Archive to completed matches
            await db.ref(`sports/${sport}/completed/${matchId}`).set(match);
            await matchesRef.child(matchId).remove();
            cleanedCount++;
          }
        }
        
        if (cleanedCount > 0) {
          logger.info(`Archived ${cleanedCount} old ${sport} matches`);
        }
      }
      
      // Clean up old notifications (older than 30 days)
      const notificationCutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const notificationsRef = db.ref('notifications');
      const notificationsSnapshot = await notificationsRef.once('value');
      const notifications = notificationsSnapshot.val() || {};
      
      let notificationsCleaned = 0;
      for (const [userId, userNotifications] of Object.entries(notifications)) {
        for (const [notificationId, notification] of Object.entries(userNotifications || {})) {
          if (notification.createdAt < notificationCutoff) {
            await db.ref(`notifications/${userId}/${notificationId}`).remove();
            notificationsCleaned++;
          }
        }
      }
      
      logger.info(`Cleaned up ${notificationsCleaned} old notifications`);
      
      // Update system statistics
      await db.ref('system/stats').update({
        lastMaintenanceAt: Date.now(),
        totalSports: sports.length,
        maintenanceRunCount: admin.database.ServerValue.increment(1)
      });
      
      logger.info('Daily maintenance completed successfully');
      return { success: true, cleanedNotifications: notificationsCleaned };
    } catch (error) {
      logger.error('Error in daily maintenance:', error);
      throw error;
    }
  });

// Update cricket series points tables (every 6 hours)
exports.updateCricketSeriesPoints = functions.pubsub
  .schedule('0 */6 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      logger.info('Starting cricket series points update...');
      const db = admin.database();
      
      // Get all cricket series
      const seriesSnapshot = await db.ref('sports/cricket/series').once('value');
      const series = seriesSnapshot.val() || {};
      
      for (const [seriesId, seriesData] of Object.entries(series)) {
        if (seriesData.status === 'ongoing' || seriesData.status === 'live') {
          try {
            const pointsTable = await cricketService.getSeriesPoints(seriesId);
            if (pointsTable.length > 0) {
              await db.ref(`sports/cricket/series/${seriesId}/pointsTable`).set({
                data: pointsTable,
                lastUpdatedAt: Date.now()
              });
              logger.info(`Updated points table for series ${seriesId}`);
            }
          } catch (pointsError) {
            logger.warn(`Failed to update points for series ${seriesId}:`, pointsError.message);
          }
        }
      }
      
      logger.info('Cricket series points update completed');
      return { success: true };
    } catch (error) {
      logger.error('Error updating cricket series points:', error);
      throw error;
    }
  });

// Emergency data refresh (can be triggered manually)
exports.emergencyDataRefresh = functions.https.onCall(async (data, context) => {
  // Verify admin access
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  try {
    logger.info('Starting emergency data refresh...');
    
    // Refresh all data sources
    const [cricketResult, footballResult, multiSportResult] = await Promise.allSettled([
      cricketService.getCurrentMatches(),
      footballService.getLiveMatches(),
      multiSportService.getAllSportsData()
    ]);
    
    const results = {
      cricket: cricketResult.status === 'fulfilled' ? cricketResult.value.length : 0,
      football: footballResult.status === 'fulfilled' ? footballResult.value.length : 0,
      multiSport: multiSportResult.status === 'fulfilled' ? 
        Object.values(multiSportResult.value).reduce((sum, arr) => sum + arr.length, 0) : 0
    };
    
    logger.info('Emergency data refresh completed', results);
    return { success: true, results };
  } catch (error) {
    logger.error('Error in emergency data refresh:', error);
    throw new functions.https.HttpsError('internal', 'Data refresh failed');
  }
});

// Health check endpoint
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    services: {
      cricket: 'active',
      football: 'active',
      multiSport: 'active'
    },
    version: '1.0.0'
  });
});
