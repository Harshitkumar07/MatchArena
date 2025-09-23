/**
 * HTTP API Endpoints for Sports Data
 * These endpoints will be called by your React frontend
 */

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const sportsApiService = require('../services/sportsApiService');

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://matcharena-app-e3d24.web.app',
    'https://matcharena-app-e3d24.firebaseapp.com'
  ]
}));

// Parse JSON bodies
app.use(express.json());

// ============ CRICKET ENDPOINTS ============

// Get cricket matches by type
app.get('/cricket/matches/:type', async (req, res) => {
  try {
    const { type } = req.params; // 'live', 'upcoming', 'recent'
    
    if (!['live', 'upcoming', 'recent', 'all'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid match type. Use: live, upcoming, recent, or all' 
      });
    }

    const matches = await sportsApiService.getCricketMatches(type);
    
    res.json({
      success: true,
      data: matches,
      count: matches.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Cricket matches error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch cricket matches',
      message: error.message 
    });
  }
});

// Get cricket match detail
app.get('/cricket/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await sportsApiService.getCricketMatchDetail(matchId);
    
    res.json({
      success: true,
      data: match,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Cricket match detail error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch match details',
      message: error.message 
    });
  }
});

// Get cricket series
app.get('/cricket/series', async (req, res) => {
  try {
    const series = await sportsApiService.getCricketSeries();
    
    res.json({
      success: true,
      data: series,
      count: series.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Cricket series error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch cricket series',
      message: error.message 
    });
  }
});

// ============ MULTI-SPORT ENDPOINTS (Football API) ============

// Get all supported sports
app.get('/sports/list', async (req, res) => {
  try {
    const sports = await sportsApiService.getSportsList();
    
    res.json({
      success: true,
      data: sports,
      count: sports.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Sports list error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch sports list',
      message: error.message 
    });
  }
});

// Get fixtures for any sport
app.get('/sports/:sport/fixtures', async (req, res) => {
  try {
    const { sport } = req.params;
    const { league, season, status } = req.query;
    
    const fixtures = await sportsApiService.getFootballFixtures(sport, league, season);
    
    // Filter by status if provided
    let filteredFixtures = fixtures;
    if (status && ['live', 'upcoming', 'completed'].includes(status)) {
      filteredFixtures = fixtures.filter(f => f.status === status);
    }
    
    res.json({
      success: true,
      data: filteredFixtures,
      count: filteredFixtures.length,
      filters: { sport, league, season, status },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error(`${req.params.sport} fixtures error:`, error);
    res.status(500).json({ 
      success: false,
      error: `Failed to fetch ${req.params.sport} fixtures`,
      message: error.message 
    });
  }
});

// Get leagues for any sport
app.get('/sports/:sport/leagues', async (req, res) => {
  try {
    const { sport } = req.params;
    const leagues = await sportsApiService.getFootballLeagues(sport);
    
    res.json({
      success: true,
      data: leagues,
      count: leagues.length,
      sport: sport,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error(`${req.params.sport} leagues error:`, error);
    res.status(500).json({ 
      success: false,
      error: `Failed to fetch ${req.params.sport} leagues`,
      message: error.message 
    });
  }
});

// ============ COMBINED ENDPOINTS ============

// Get live matches from all sports
app.get('/matches/live', async (req, res) => {
  try {
    // Get live cricket matches
    const cricketMatches = await sportsApiService.getCricketMatches('live');
    
    // Get live matches from popular sports
    const popularSports = ['football', 'basketball', 'tennis'];
    const sportsPromises = popularSports.map(async sport => {
      try {
        const fixtures = await sportsApiService.getFootballFixtures(sport);
        return fixtures.filter(f => f.status === 'live');
      } catch (error) {
        console.warn(`Failed to fetch live ${sport} matches:`, error.message);
        return [];
      }
    });
    
    const sportsResults = await Promise.all(sportsPromises);
    const allSportsMatches = sportsResults.flat();
    
    const allLiveMatches = [...cricketMatches, ...allSportsMatches];
    
    // Sort by sport and start time
    allLiveMatches.sort((a, b) => {
      if (a.sport !== b.sport) {
        return a.sport.localeCompare(b.sport);
      }
      return a.startsAt - b.startsAt;
    });
    
    res.json({
      success: true,
      data: allLiveMatches,
      count: allLiveMatches.length,
      breakdown: {
        cricket: cricketMatches.length,
        other_sports: allSportsMatches.length
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Live matches error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch live matches',
      message: error.message 
    });
  }
});

// Get upcoming matches from all sports
app.get('/matches/upcoming', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    // Get upcoming cricket matches
    const cricketMatches = await sportsApiService.getCricketMatches('upcoming');
    
    // Get upcoming matches from popular sports
    const popularSports = ['football', 'basketball', 'tennis'];
    const sportsPromises = popularSports.map(async sport => {
      try {
        const fixtures = await sportsApiService.getFootballFixtures(sport);
        const now = Date.now();
        const maxTime = now + (days * 24 * 60 * 60 * 1000);
        
        return fixtures.filter(f => 
          f.status === 'upcoming' && 
          f.startsAt > now && 
          f.startsAt <= maxTime
        );
      } catch (error) {
        console.warn(`Failed to fetch upcoming ${sport} matches:`, error.message);
        return [];
      }
    });
    
    const sportsResults = await Promise.all(sportsPromises);
    const allSportsMatches = sportsResults.flat();
    
    const allUpcomingMatches = [...cricketMatches, ...allSportsMatches];
    
    // Sort by start time
    allUpcomingMatches.sort((a, b) => a.startsAt - b.startsAt);
    
    res.json({
      success: true,
      data: allUpcomingMatches,
      count: allUpcomingMatches.length,
      filters: { days },
      breakdown: {
        cricket: cricketMatches.length,
        other_sports: allSportsMatches.length
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Upcoming matches error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch upcoming matches',
      message: error.message 
    });
  }
});

// ============ UTILITY ENDPOINTS ============

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: '1.0.0',
    services: {
      cricket_api: !!functions.config().cricket?.api_key,
      football_api: !!functions.config().football?.api_key
    }
  });
});

// Get API status and limits
app.get('/api/status', async (req, res) => {
  try {
    res.json({
      success: true,
      apis: {
        cricket: {
          configured: !!functions.config().cricket?.api_key,
          base_url: 'https://api.cricapi.com/v1'
        },
        football: {
          configured: !!functions.config().football?.api_key,
          base_url: 'https://v3.football.api-sports.io'
        }
      },
      cache_stats: {
        entries: sportsApiService.cache.size,
        live_timeout: sportsApiService.liveCacheTimeout / 1000 + 's',
        standard_timeout: sportsApiService.standardCacheTimeout / 1000 + 's'
      },
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get API status',
      message: error.message
    });
  }
});

// Error handler middleware
app.use((error, req, res, next) => {
  console.error('Unhandled API error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /cricket/matches/:type',
      'GET /cricket/match/:matchId',  
      'GET /cricket/series',
      'GET /sports/list',
      'GET /sports/:sport/fixtures',
      'GET /sports/:sport/leagues',
      'GET /matches/live',
      'GET /matches/upcoming',
      'GET /health',
      'GET /api/status'
    ]
  });
});

module.exports = app;
