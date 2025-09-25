const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { getConfig } = require('./src/config');

// Initialize Firebase Admin
admin.initializeApp();

// Import routes
const cricketRoutes = require('./src/routes/cricket');
const sportsRoutes = require('./src/routes/sports');

// Create Express app
const app = express();

// Get configuration
const config = getConfig();

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.app.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow localhost during development
    if (origin && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: Date.now(),
    message: 'MatchArena API is operational',
    version: '2.0.0-real-apis',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    mode: 'production',
    apis: {
      cricapi: { 
        status: 'active', 
        message: 'Using real CricAPI for cricket data',
        hasKey: !!config.cricapi.key
      },
      apisports: { 
        status: 'active', 
        message: 'Using real API-Sports for multi-sport data',
        hasKey: !!config.apisports.key,
        supportedSports: Object.keys(config.apisports.hosts).length
      }
    },
    endpoints: {
      cricket: ['/api/cricket/live', '/api/cricket/upcoming', '/api/cricket/recent', '/api/cricket/series'],
      sports: ['/api/sports/:sport/live', '/api/sports/:sport/upcoming', '/api/sports/list']
    },
    timestamp: Date.now()
  });
});

// Mount routes
app.use('/cricket', cricketRoutes);
app.use('/sports', sportsRoutes);

// Combined live matches endpoint (cricket + sports)
app.get('/matches/live', async (req, res) => {
  try {
    functions.logger.info('Fetching combined live matches');
    
    const cricketService = require('./src/services/cricapi');
    const apiSportsService = require('./src/services/apisports');
    const { normalizeMatch: normalizeCricketMatch } = require('./src/mappers/cricket');
    const { normalizeMatch: normalizeSportsMatch, formatMatchForDisplay } = require('./src/mappers/sports');
    
    // Fetch cricket matches
    const cricketMatches = await cricketService.getLiveMatches()
      .then(matches => matches.map(match => normalizeCricketMatch(match)))
      .catch(error => {
        functions.logger.warn('Cricket live matches failed:', error);
        return [];
      });
    
    // Fetch multi-sport matches
    const sportsMatches = await apiSportsService.getAllLiveMatches()
      .then(matches => matches.map(match => normalizeSportsMatch(match, match.sport)))
      .catch(error => {
        functions.logger.warn('Sports live matches failed:', error);
        return [];
      });
    
    // Combine and format all matches
    const allMatches = [...cricketMatches, ...sportsMatches]
      .filter(match => match !== null)
      .map(match => formatMatchForDisplay(match));
    
    res.json({
      success: true,
      data: allMatches,
      count: allMatches.length,
      breakdown: {
        cricket: cricketMatches.length,
        sports: sportsMatches.length
      },
      lastUpdated: Date.now()
    });
    
  } catch (error) {
    functions.logger.error('Combined live matches error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch live matches',
        code: 'COMBINED_LIVE_ERROR'
      },
      data: []
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  functions.logger.error('Express error:', error);
  
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'CORS policy violation',
        code: 'CORS_ERROR'
      }
    });
  }
  
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND'
    },
    availableEndpoints: {
      cricket: ['/api/cricket/live', '/api/cricket/upcoming', '/api/cricket/recent', '/api/cricket/series'],
      sports: ['/api/sports/list', '/api/sports/:sport/live', '/api/sports/:sport/upcoming'],
      combined: ['/api/matches/live']
    }
  });
});

// Export the Express app as a Firebase Function
exports.api = functions.region('us-central1').https.onRequest(app);

// Legacy endpoints for backward compatibility
exports.sportsApi = functions.https.onRequest(app);
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: '2.0.0-real-apis',
    message: 'MatchArena Functions are running with real APIs!',
    uptime: process.uptime()
  });
});

functions.logger.info('🚀 MatchArena Functions loaded successfully with real API integration!');
