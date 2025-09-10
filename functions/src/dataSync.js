const admin = require('firebase-admin');
const logger = require('./utils/logger');

// Update series standings based on match results
async function updateSeriesStandings() {
  const db = admin.database();
  try {
    const seriesRef = db.ref('series');
    const snapshot = await seriesRef.once('value');
    const seriesData = snapshot.val() || {};

    for (const [seriesId, series] of Object.entries(seriesData)) {
      const standings = await calculateStandingsForSeries(seriesId);
      await db.ref(`series/${seriesId}/standings`).set(standings);
      logger.info(`Updated standings for series ${seriesId}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Error updating series standings:', error);
    throw error;
  }
}

// Calculate standings for a series
async function calculateStandingsForSeries(seriesId) {
  const db = admin.database();
  const matchesSnapshot = await db.ref(`series/${seriesId}/matches`).once('value');
  const matches = matchesSnapshot.val() || {};

  const teamStats = {};

  for (const [matchId, match] of Object.entries(matches)) {
    if (match.status !== 'completed') continue;

    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;

    if (!teamStats[homeTeam]) teamStats[homeTeam] = { team: homeTeam, played: 0, won: 0, lost: 0, ties: 0, points: 0 };
    if (!teamStats[awayTeam]) teamStats[awayTeam] = { team: awayTeam, played: 0, won: 0, lost: 0, ties: 0, points: 0 };

    teamStats[homeTeam].played++;
    teamStats[awayTeam].played++;

    if (match.result === 'draw' || match.result === 'tie') {
      teamStats[homeTeam].ties++;
      teamStats[awayTeam].ties++;
      teamStats[homeTeam].points += 1;
      teamStats[awayTeam].points += 1;
    } else if (match.winner === homeTeam) {
      teamStats[homeTeam].won++;
      teamStats[homeTeam].points += 2; // Example points
      teamStats[awayTeam].lost++;
    } else if (match.winner === awayTeam) {
      teamStats[awayTeam].won++;
      teamStats[awayTeam].points += 2;
      teamStats[homeTeam].lost++;
    }
  }

  // Convert to array and sort by points, then wins
  const standings = Object.values(teamStats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.won - a.won;
  });

  // Add position
  standings.forEach((team, index) => {
    team.position = index + 1;
  });

  return standings;
}

// Daily cleanup tasks
async function dailyCleanup() {
  const db = admin.database();
  try {
    // Remove old notifications older than 30 days
    const notificationsRef = db.ref('notifications');
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const notificationsSnapshot = await notificationsRef.once('value');
    const notifications = notificationsSnapshot.val() || {};

    for (const [userId, userNotifications] of Object.entries(notifications)) {
      for (const [notificationId, notification] of Object.entries(userNotifications || {})) {
        if (notification.createdAt < cutoff) {
          await db.ref(`notifications/${userId}/${notificationId}`).remove();
        }
      }
    }

    // Archive completed matches older than 90 days
    const matchesRef = db.ref('matches');
    const matchesSnapshot = await matchesRef.once('value');
    const matches = matchesSnapshot.val() || {};

    for (const [sport, sportMatches] of Object.entries(matches)) {
      for (const [matchId, match] of Object.entries(sportMatches || {})) {
        if (match.status === 'completed' && match.startTime < cutoff - (60 * 24 * 60 * 60 * 1000)) {
          await db.ref(`archives/matches/${sport}/${matchId}`).set(match);
          await db.ref(`matches/${sport}/${matchId}`).remove();
        }
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in daily cleanup:', error);
    throw error;
  }
}

module.exports = {
  updateSeriesStandings,
  dailyCleanup,
};
