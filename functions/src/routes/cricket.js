const express = require('express');
const cricAPIService = require('../services/cricapi');
const { normalizeMatch, normalizeSeries, formatMatchForDisplay } = require('../mappers/cricket');
const { setCacheHeaders } = require('../utils/cache');
const functions = require('firebase-functions');

const router = express.Router();

/**
 * GET /api/cricket/live
 * Get live cricket matches
 */
router.get('/live', async (req, res) => {
  try {
    functions.logger.info('Fetching live cricket matches');
    
    const rawMatches = await cricAPIService.getLiveMatches();
    const normalizedMatches = rawMatches
      .map(match => normalizeMatch(match))
      .filter(match => match !== null)
      .map(match => formatMatchForDisplay(match));
    
    setCacheHeaders(res, 'live');
    
    res.json({
      success: true,
      data: normalizedMatches,
      count: normalizedMatches.length,
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Cricket live matches error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch live cricket matches',
        code: 'CRICKET_LIVE_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/cricket/upcoming
 * Get upcoming cricket matches
 */
router.get('/upcoming', async (req, res) => {
  try {
    functions.logger.info('Fetching upcoming cricket matches');
    
    const rawMatches = await cricAPIService.getUpcomingMatches();
    const normalizedMatches = rawMatches
      .map(match => normalizeMatch(match))
      .filter(match => match !== null)
      .map(match => formatMatchForDisplay(match));
    
    setCacheHeaders(res, 'upcoming');
    
    res.json({
      success: true,
      data: normalizedMatches,
      count: normalizedMatches.length,
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Cricket upcoming matches error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch upcoming cricket matches',
        code: 'CRICKET_UPCOMING_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/cricket/recent
 * Get recent cricket matches
 */
router.get('/recent', async (req, res) => {
  try {
    functions.logger.info('Fetching recent cricket matches');
    
    const rawMatches = await cricAPIService.getRecentMatches();
    const normalizedMatches = rawMatches
      .map(match => normalizeMatch(match))
      .filter(match => match !== null)
      .map(match => formatMatchForDisplay(match));
    
    setCacheHeaders(res, 'recent');
    
    res.json({
      success: true,
      data: normalizedMatches,
      count: normalizedMatches.length,
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Cricket recent matches error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch recent cricket matches',
        code: 'CRICKET_RECENT_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/cricket/series
 * Get cricket series
 */
router.get('/series', async (req, res) => {
  try {
    functions.logger.info('Fetching cricket series');
    
    const rawSeries = await cricAPIService.getSeries();
    const normalizedSeries = rawSeries
      .map(series => normalizeSeries(series))
      .filter(series => series !== null);
    
    setCacheHeaders(res, 'leagues');
    
    res.json({
      success: true,
      data: normalizedSeries,
      count: normalizedSeries.length,
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Cricket series error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch cricket series',
        code: 'CRICKET_SERIES_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/cricket/match/:id
 * Get cricket match details
 */
router.get('/match/:id', async (req, res) => {
  try {
    const matchId = req.params.id;
    functions.logger.info(`Fetching cricket match details for ${matchId}`);
    
    const rawMatch = await cricAPIService.getMatchDetails(matchId);
    const normalizedMatch = normalizeMatch(rawMatch);
    
    if (!normalizedMatch) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Match not found',
          code: 'MATCH_NOT_FOUND'
        }
      });
    }
    
    setCacheHeaders(res, 'live');
    
    res.json({
      success: true,
      data: formatMatchForDisplay(normalizedMatch),
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Cricket match details error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch cricket match details',
        code: 'CRICKET_MATCH_ERROR'
      }
    });
  }
});

/**
 * GET /api/cricket/scorecard/:id
 * Get cricket match scorecard
 */
router.get('/scorecard/:id', async (req, res) => {
  try {
    const matchId = req.params.id;
    functions.logger.info(`Fetching cricket scorecard for ${matchId}`);
    
    const scorecard = await cricAPIService.getMatchScorecard(matchId);
    
    setCacheHeaders(res, 'live');
    
    res.json({
      success: true,
      data: scorecard,
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Cricket scorecard error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch cricket scorecard',
        code: 'CRICKET_SCORECARD_ERROR'
      },
      data: null
    });
  }
});

/**
 * GET /api/cricket/matches
 * Get all cricket matches with filtering
 */
router.get('/matches', async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    functions.logger.info(`Fetching cricket matches with status: ${status}`);
    
    let matches = [];
    
    if (status === 'all' || status === 'live') {
      const live = await cricAPIService.getLiveMatches();
      matches.push(...live.map(m => ({ ...normalizeMatch(m), matchStatus: 'live' })));
    }
    
    if (status === 'all' || status === 'upcoming') {
      const upcoming = await cricAPIService.getUpcomingMatches();
      matches.push(...upcoming.map(m => ({ ...normalizeMatch(m), matchStatus: 'upcoming' })));
    }
    
    if (status === 'all' || status === 'recent') {
      const recent = await cricAPIService.getRecentMatches();
      matches.push(...recent.map(m => ({ ...normalizeMatch(m), matchStatus: 'recent' })));
    }
    
    const normalizedMatches = matches
      .filter(match => match !== null)
      .map(match => formatMatchForDisplay(match))
      .sort((a, b) => {
        // Sort by match time (live first, then upcoming, then recent)
        if (a.fixture.status.short === 'LIVE' && b.fixture.status.short !== 'LIVE') return -1;
        if (b.fixture.status.short === 'LIVE' && a.fixture.status.short !== 'LIVE') return 1;
        
        const timeA = new Date(a.fixture.startTime).getTime();
        const timeB = new Date(b.fixture.startTime).getTime();
        
        if (a.fixture.status.short === 'NS' && b.fixture.status.short === 'NS') {
          return timeA - timeB; // Upcoming: earliest first
        }
        
        return timeB - timeA; // Recent: latest first
      });
    
    setCacheHeaders(res, status === 'live' ? 'live' : 'upcoming');
    
    res.json({
      success: true,
      data: normalizedMatches,
      count: normalizedMatches.length,
      filters: { status },
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Cricket matches error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch cricket matches',
        code: 'CRICKET_MATCHES_ERROR'
      },
      data: []
    });
  }
});

module.exports = router;
