const express = require('express');
const apiSportsService = require('../services/apisports');
const { normalizeMatch, normalizeLeague, normalizeTeam, formatMatchForDisplay } = require('../mappers/sports');
const { setCacheHeaders } = require('../utils/cache');
const functions = require('firebase-functions');

const router = express.Router();

/**
 * GET /api/sports/list
 * Get supported sports list
 */
router.get('/list', async (req, res) => {
  try {
    functions.logger.info('Fetching supported sports list');
    
    const sports = apiSportsService.getSupportedSports();
    
    setCacheHeaders(res, 'leagues');
    
    res.json({
      success: true,
      data: sports,
      count: sports.length,
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Sports list error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch sports list',
        code: 'SPORTS_LIST_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/sports/:sport/live
 * Get live matches for a specific sport
 */
router.get('/:sport/live', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    functions.logger.info(`Fetching live matches for ${sport}`);
    
    const rawMatches = await apiSportsService.getLiveMatches(sport);
    const normalizedMatches = rawMatches
      .map(match => normalizeMatch(match, sport))
      .filter(match => match !== null)
      .map(match => formatMatchForDisplay(match));
    
    setCacheHeaders(res, 'live');
    
    res.json({
      success: true,
      data: normalizedMatches,
      count: normalizedMatches.length,
      sport: sport,
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error(`${req.params.sport} live matches error:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: `Failed to fetch live ${req.params.sport} matches`,
        code: 'SPORT_LIVE_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/sports/:sport/upcoming
 * Get upcoming matches for a specific sport
 */
router.get('/:sport/upcoming', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const days = parseInt(req.query.days) || 7;
    
    functions.logger.info(`Fetching upcoming matches for ${sport} (${days} days)`);
    
    const rawMatches = await apiSportsService.getUpcomingMatches(sport, days);
    const normalizedMatches = rawMatches
      .map(match => normalizeMatch(match, sport))
      .filter(match => match !== null)
      .map(match => formatMatchForDisplay(match));
    
    setCacheHeaders(res, 'upcoming');
    
    res.json({
      success: true,
      data: normalizedMatches,
      count: normalizedMatches.length,
      sport: sport,
      filters: { days },
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error(`${req.params.sport} upcoming matches error:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: `Failed to fetch upcoming ${req.params.sport} matches`,
        code: 'SPORT_UPCOMING_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/sports/:sport/recent
 * Get recent matches for a specific sport
 */
router.get('/:sport/recent', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const days = parseInt(req.query.days) || 7;
    
    functions.logger.info(`Fetching recent matches for ${sport} (${days} days)`);
    
    const rawMatches = await apiSportsService.getRecentMatches(sport, days);
    const normalizedMatches = rawMatches
      .map(match => normalizeMatch(match, sport))
      .filter(match => match !== null)
      .map(match => formatMatchForDisplay(match));
    
    setCacheHeaders(res, 'recent');
    
    res.json({
      success: true,
      data: normalizedMatches,
      count: normalizedMatches.length,
      sport: sport,
      filters: { days },
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error(`${req.params.sport} recent matches error:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: `Failed to fetch recent ${req.params.sport} matches`,
        code: 'SPORT_RECENT_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/sports/:sport/leagues
 * Get leagues for a specific sport
 */
router.get('/:sport/leagues', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const country = req.query.country;
    
    functions.logger.info(`Fetching leagues for ${sport}${country ? ` in ${country}` : ''}`);
    
    const rawLeagues = await apiSportsService.getLeagues(sport, country);
    const normalizedLeagues = rawLeagues
      .map(league => normalizeLeague(league))
      .filter(league => league !== null);
    
    setCacheHeaders(res, 'leagues');
    
    res.json({
      success: true,
      data: normalizedLeagues,
      count: normalizedLeagues.length,
      sport: sport,
      filters: { country },
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error(`${req.params.sport} leagues error:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: `Failed to fetch ${req.params.sport} leagues`,
        code: 'SPORT_LEAGUES_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/sports/:sport/standings
 * Get standings for a specific sport league
 */
router.get('/:sport/standings', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const { league, season } = req.query;
    
    if (!league || !season) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'League and season parameters are required',
          code: 'MISSING_PARAMETERS'
        }
      });
    }
    
    functions.logger.info(`Fetching standings for ${sport} league ${league} season ${season}`);
    
    const standings = await apiSportsService.getStandings(sport, league, season);
    
    setCacheHeaders(res, 'standings');
    
    res.json({
      success: true,
      data: standings,
      sport: sport,
      filters: { league, season },
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error(`${req.params.sport} standings error:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: `Failed to fetch ${req.params.sport} standings`,
        code: 'SPORT_STANDINGS_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/sports/:sport/teams
 * Get teams for a specific sport
 */
router.get('/:sport/teams', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const { league, season, search } = req.query;
    
    functions.logger.info(`Fetching teams for ${sport}`, { league, season, search });
    
    const rawTeams = await apiSportsService.getTeams(sport, league, season, search);
    const normalizedTeams = rawTeams
      .map(team => normalizeTeam(team))
      .filter(team => team !== null);
    
    setCacheHeaders(res, 'leagues');
    
    res.json({
      success: true,
      data: normalizedTeams,
      count: normalizedTeams.length,
      sport: sport,
      filters: { league, season, search },
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error(`${req.params.sport} teams error:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: `Failed to fetch ${req.params.sport} teams`,
        code: 'SPORT_TEAMS_ERROR'
      },
      data: []
    });
  }
});

/**
 * GET /api/sports/all/live
 * Get live matches from all sports
 */
router.get('/all/live', async (req, res) => {
  try {
    functions.logger.info('Fetching live matches from all sports');
    
    const rawMatches = await apiSportsService.getAllLiveMatches();
    const normalizedMatches = rawMatches
      .map(match => normalizeMatch(match, match.sport))
      .filter(match => match !== null)
      .map(match => formatMatchForDisplay(match));
    
    // Group by sport
    const groupedMatches = normalizedMatches.reduce((acc, match) => {
      if (!acc[match.sport]) {
        acc[match.sport] = [];
      }
      acc[match.sport].push(match);
      return acc;
    }, {});
    
    setCacheHeaders(res, 'live');
    
    res.json({
      success: true,
      data: normalizedMatches,
      grouped: groupedMatches,
      count: normalizedMatches.length,
      sports: Object.keys(groupedMatches),
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('All sports live matches error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch live matches from all sports',
        code: 'ALL_SPORTS_LIVE_ERROR'
      },
      data: [],
      grouped: {}
    });
  }
});

/**
 * GET /api/sports/popular
 * Get matches from popular sports only
 */
router.get('/popular', async (req, res) => {
  try {
    const { status = 'live' } = req.query;
    functions.logger.info(`Fetching ${status} matches from popular sports`);
    
    const popularSports = ['football', 'basketball', 'tennis', 'hockey'];
    const allMatches = [];
    
    for (const sport of popularSports) {
      try {
        let matches = [];
        
        if (status === 'live') {
          matches = await apiSportsService.getLiveMatches(sport);
        } else if (status === 'upcoming') {
          matches = await apiSportsService.getUpcomingMatches(sport, 7);
        } else if (status === 'recent') {
          matches = await apiSportsService.getRecentMatches(sport, 7);
        }
        
        const normalized = matches
          .map(match => normalizeMatch(match, sport))
          .filter(match => match !== null)
          .map(match => formatMatchForDisplay(match));
        
        allMatches.push(...normalized);
      } catch (error) {
        functions.logger.warn(`Failed to fetch ${status} matches for ${sport}:`, error);
      }
    }
    
    setCacheHeaders(res, status === 'live' ? 'live' : 'upcoming');
    
    res.json({
      success: true,
      data: allMatches,
      count: allMatches.length,
      sports: popularSports,
      filters: { status },
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Popular sports matches error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch matches from popular sports',
        code: 'POPULAR_SPORTS_ERROR'
      },
      data: []
    });
  }
});

module.exports = router;
