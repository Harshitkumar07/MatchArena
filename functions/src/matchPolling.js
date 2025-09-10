const admin = require('firebase-admin');
const axios = require('axios');
const functions = require('firebase-functions');
const { normalizeMatchData } = require('./utils/dataHelpers');
const logger = require('./utils/logger');

// API configurations (would be stored in environment variables)
const API_CONFIGS = {
  cricket: {
    baseUrl: process.env.CRICKET_API_URL || 'https://api.cricapi.com/v1',
    apiKey: process.env.CRICKET_API_KEY,
    endpoints: {
      live: '/currentMatches',
      upcoming: '/matches',
      series: '/series',
    },
  },
  football: {
    baseUrl: process.env.FOOTBALL_API_URL || 'https://api.football-data.org/v2',
    apiKey: process.env.FOOTBALL_API_KEY,
    endpoints: {
      live: '/matches',
      upcoming: '/matches',
      competitions: '/competitions',
    },
  },
  basketball: {
    baseUrl: process.env.BASKETBALL_API_URL || 'https://api.sportsdata.io/v3/nba',
    apiKey: process.env.BASKETBALL_API_KEY,
    endpoints: {
      live: '/scores/json/GamesByDate',
      upcoming: '/scores/json/Games',
    },
  },
};

// Poll live matches for all sports
async function pollLiveMatches() {
  const db = admin.database();
  const results = [];

  try {
    // Poll each sport API
    for (const [sport, config] of Object.entries(API_CONFIGS)) {
      if (!config.apiKey) {
        logger.warn(`No API key configured for ${sport}`);
        continue;
      }

      try {
        const liveMatches = await fetchLiveMatches(sport, config);
        
        // Process and save each match
        for (const match of liveMatches) {
          const normalizedMatch = normalizeMatchData(match, sport);
          
          // Save to database
          await db.ref(`matches/${sport}/${normalizedMatch.id}`).update({
            ...normalizedMatch,
            lastUpdated: admin.database.ServerValue.TIMESTAMP,
          });

          // Update live ticker if match is live
          if (normalizedMatch.status === 'live') {
            await db.ref(`liveTicker/${sport}/${normalizedMatch.id}`).set({
              homeTeam: normalizedMatch.homeTeam,
              awayTeam: normalizedMatch.awayTeam,
              homeScore: normalizedMatch.homeScore,
              awayScore: normalizedMatch.awayScore,
              currentTime: normalizedMatch.currentTime,
              venue: normalizedMatch.venue,
              priority: calculatePriority(normalizedMatch),
            });
          }

          results.push({
            sport,
            matchId: normalizedMatch.id,
            status: normalizedMatch.status,
          });
        }

        logger.info(`Polled ${liveMatches.length} live matches for ${sport}`);
      } catch (error) {
        logger.error(`Error polling ${sport} matches:`, error);
      }
    }

    // Clean up old live ticker entries
    await cleanupLiveTicker();

    return { success: true, results };
  } catch (error) {
    logger.error('Error in pollLiveMatches:', error);
    throw error;
  }
}

// Poll upcoming matches
async function pollUpcomingMatches() {
  const db = admin.database();
  const results = [];

  try {
    for (const [sport, config] of Object.entries(API_CONFIGS)) {
      if (!config.apiKey) continue;

      try {
        const upcomingMatches = await fetchUpcomingMatches(sport, config);
        
        for (const match of upcomingMatches) {
          const normalizedMatch = normalizeMatchData(match, sport);
          
          // Only save if match is in the next 7 days
          const matchDate = new Date(normalizedMatch.startTime);
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          
          if (matchDate <= sevenDaysFromNow) {
            await db.ref(`matches/${sport}/${normalizedMatch.id}`).update({
              ...normalizedMatch,
              lastUpdated: admin.database.ServerValue.TIMESTAMP,
            });

            results.push({
              sport,
              matchId: normalizedMatch.id,
              startTime: normalizedMatch.startTime,
            });
          }
        }

        logger.info(`Polled ${upcomingMatches.length} upcoming matches for ${sport}`);
      } catch (error) {
        logger.error(`Error polling upcoming ${sport} matches:`, error);
      }
    }

    return { success: true, results };
  } catch (error) {
    logger.error('Error in pollUpcomingMatches:', error);
    throw error;
  }
}

// Fetch live matches from API
async function fetchLiveMatches(sport, config) {
  try {
    const response = await axios.get(
      `${config.baseUrl}${config.endpoints.live}`,
      {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json',
        },
        params: {
          offset: 0,
        },
      }
    );

    // Different APIs return data in different formats
    switch (sport) {
      case 'cricket':
        return response.data.data || [];
      case 'football':
        return response.data.matches?.filter(m => m.status === 'IN_PLAY') || [];
      case 'basketball':
        return response.data?.filter(m => m.Status === 'InProgress') || [];
      default:
        return [];
    }
  } catch (error) {
    logger.error(`Error fetching live ${sport} matches:`, error.message);
    return [];
  }
}

// Fetch upcoming matches from API
async function fetchUpcomingMatches(sport, config) {
  try {
    const response = await axios.get(
      `${config.baseUrl}${config.endpoints.upcoming}`,
      {
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json',
        },
        params: {
          offset: 0,
          dateFrom: new Date().toISOString().split('T')[0],
        },
      }
    );

    switch (sport) {
      case 'cricket':
        return response.data.data?.filter(m => !m.matchStarted) || [];
      case 'football':
        return response.data.matches?.filter(m => m.status === 'SCHEDULED') || [];
      case 'basketball':
        return response.data?.filter(m => m.Status === 'Scheduled') || [];
      default:
        return [];
    }
  } catch (error) {
    logger.error(`Error fetching upcoming ${sport} matches:`, error.message);
    return [];
  }
}

// Calculate priority for live ticker
function calculatePriority(match) {
  let priority = 0;
  
  // Higher priority for close matches
  const scoreDiff = Math.abs(match.homeScore - match.awayScore);
  if (scoreDiff <= 10) priority += 50;
  else if (scoreDiff <= 20) priority += 30;
  
  // Higher priority for matches in final stages
  if (match.currentTime >= 80) priority += 30; // Football
  if (match.currentInning >= 4) priority += 30; // Cricket T20
  if (match.currentQuarter >= 4) priority += 30; // Basketball
  
  // Higher priority for popular teams (would check against a list)
  if (isPopularTeam(match.homeTeam) || isPopularTeam(match.awayTeam)) {
    priority += 20;
  }
  
  return priority;
}

// Check if team is popular (simplified)
function isPopularTeam(teamName) {
  const popularTeams = [
    'India', 'Australia', 'England', 'Pakistan',
    'Real Madrid', 'Barcelona', 'Manchester United', 'Liverpool',
    'Lakers', 'Warriors', 'Celtics', 'Bulls',
  ];
  
  return popularTeams.some(team => 
    teamName?.toLowerCase().includes(team.toLowerCase())
  );
}

// Clean up old live ticker entries
async function cleanupLiveTicker() {
  const db = admin.database();
  const ticker = await db.ref('liveTicker').once('value');
  const data = ticker.val() || {};
  
  for (const [sport, matches] of Object.entries(data)) {
    for (const [matchId, matchData] of Object.entries(matches || {})) {
      // Remove if match is no longer live
      const match = await db.ref(`matches/${sport}/${matchId}/status`).once('value');
      if (match.val() !== 'live') {
        await db.ref(`liveTicker/${sport}/${matchId}`).remove();
      }
    }
  }
}

// Handle cricket webhook
async function handleCricketWebhook(req, res) {
  try {
    // Verify webhook signature
    const signature = req.headers['x-webhook-signature'];
    if (!verifyWebhookSignature(signature, req.body)) {
      return res.status(401).send('Invalid signature');
    }

    const { matchId, data } = req.body;
    const normalizedMatch = normalizeMatchData(data, 'cricket');
    
    // Update match in database
    await admin.database()
      .ref(`matches/cricket/${matchId}`)
      .update({
        ...normalizedMatch,
        lastUpdated: admin.database.ServerValue.TIMESTAMP,
      });

    logger.info(`Cricket webhook processed for match ${matchId}`);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling cricket webhook:', error);
    res.status(500).send('Internal error');
  }
}

// Handle football webhook
async function handleFootballWebhook(req, res) {
  try {
    // Verify webhook signature
    const signature = req.headers['x-webhook-signature'];
    if (!verifyWebhookSignature(signature, req.body)) {
      return res.status(401).send('Invalid signature');
    }

    const { matchId, data } = req.body;
    const normalizedMatch = normalizeMatchData(data, 'football');
    
    // Update match in database
    await admin.database()
      .ref(`matches/football/${matchId}`)
      .update({
        ...normalizedMatch,
        lastUpdated: admin.database.ServerValue.TIMESTAMP,
      });

    logger.info(`Football webhook processed for match ${matchId}`);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling football webhook:', error);
    res.status(500).send('Internal error');
  }
}

// Verify webhook signature
function verifyWebhookSignature(signature, body) {
  // Implementation would verify the signature
  // This is a placeholder
  return true;
}

module.exports = {
  pollLiveMatches,
  pollUpcomingMatches,
  handleCricketWebhook,
  handleFootballWebhook,
};
