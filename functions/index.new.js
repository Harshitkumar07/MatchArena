const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Mock data for development/testing
const mockCricketMatches = [
  {
    id: "1",
    sport: "cricket", 
    teams: {
      home: { name: "India", shortName: "IND", logo: "🇮🇳" },
      away: { name: "Australia", shortName: "AUS", logo: "🇦🇺" }
    },
    status: "live",
    scores: {
      home: { runs: 287, wickets: 4, overs: 48.3 },
      away: { runs: 251, wickets: 8, overs: 50.0 }
    },
    venue: "Wankhede Stadium, Mumbai",
    seriesName: "India vs Australia ODI Series",
    startsAt: Date.now() - 3600000,
    updatedAt: Date.now()
  },
  {
    id: "2", 
    sport: "cricket",
    teams: {
      home: { name: "England", shortName: "ENG", logo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      away: { name: "Pakistan", shortName: "PAK", logo: "🇵🇰" }
    },
    status: "upcoming",
    venue: "Lord's, London", 
    seriesName: "England vs Pakistan Test Series",
    startsAt: Date.now() + 7200000,
    updatedAt: Date.now()
  }
];

const mockSports = [
  { id: "football", name: "Football", icon: "⚽", endpoint: "football" },
  { id: "basketball", name: "Basketball", icon: "🏀", endpoint: "basketball" },
  { id: "tennis", name: "Tennis", icon: "🎾", endpoint: "tennis" },
  { id: "hockey", name: "Hockey", icon: "🏒", endpoint: "hockey" }
];

// Main Sports API endpoint
exports.sportsApi = functions.https.onRequest((req, res) => {
  // Enable CORS for all requests
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  const path = req.path;
  console.log('📡 MatchArena API Request:', req.method, path);

  try {
    // Health check
    if (path.includes('/health')) {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: Date.now(),
        message: 'MatchArena API is working!',
        version: '1.0.0-mock'
      });
      return;
    }

    // Cricket live matches
    if (path.includes('/cricket/matches/live')) {
      const liveMatches = mockCricketMatches.filter(m => m.status === 'live');
      res.json({ success: true, data: liveMatches });
      return;
    }

    // Cricket upcoming matches  
    if (path.includes('/cricket/matches/upcoming')) {
      const upcomingMatches = mockCricketMatches.filter(m => m.status === 'upcoming');
      res.json({ success: true, data: upcomingMatches });
      return;
    }

    // Cricket series
    if (path.includes('/cricket/series')) {
      res.json({
        success: true,
        data: [
          {
            id: '1',
            name: 'India vs Australia ODI Series',
            status: 'ongoing',
            startDate: Date.now() - 86400000,
            endDate: Date.now() + 604800000
          }
        ]
      });
      return;
    }

    // All live matches (all sports)
    if (path.includes('/matches/live')) {
      const allLive = [
        ...mockCricketMatches.filter(m => m.status === 'live'),
        {
          id: 'f1',
          sport: 'football',
          teams: {
            home: { name: 'Manchester United', shortName: 'MUN' },
            away: { name: 'Liverpool', shortName: 'LIV' }
          },
          status: 'live',
          scores: { home: { goals: 1 }, away: { goals: 2 } },
          venue: 'Old Trafford',
          startsAt: Date.now() - 2700000
        }
      ];
      res.json({ success: true, data: allLive });
      return;
    }

    // All upcoming matches
    if (path.includes('/matches/upcoming')) {
      const allUpcoming = mockCricketMatches.filter(m => m.status === 'upcoming');
      res.json({ success: true, data: allUpcoming });
      return;
    }

    // Sports list
    if (path.includes('/sports/list')) {
      res.json({ success: true, data: mockSports });
      return;
    }

    // Sport-specific fixtures
    if (path.includes('/sports/') && path.includes('/fixtures')) {
      const sport = path.split('/sports/')[1].split('/')[0];
      res.json({
        success: true,
        data: [
          {
            id: sport + '1',
            sport: sport,
            teams: {
              home: { name: 'Team A', shortName: 'TMA' },
              away: { name: 'Team B', shortName: 'TMB' }
            },
            status: 'upcoming',
            venue: sport.charAt(0).toUpperCase() + sport.slice(1) + ' Stadium',
            startsAt: Date.now() + 3600000
          }
        ]
      });
      return;
    }

    // Default response for unknown endpoints
    res.json({
      success: true,
      data: [],
      message: 'Endpoint ' + path + ' is under development',
      availableEndpoints: [
        '/health',
        '/cricket/matches/live',
        '/cricket/matches/upcoming', 
        '/cricket/series',
        '/matches/live',
        '/matches/upcoming',
        '/sports/list',
        '/sports/{sport}/fixtures'
      ]
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Standalone health check endpoint
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: '1.0.0-mock',
    message: 'MatchArena Functions are running!',
    uptime: process.uptime()
  });
});

// API status endpoint
exports.apiStatus = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({
    success: true,
    status: 'operational',
    mode: 'development-mock',
    apis: {
      cricket: { status: 'mock-data', message: 'Using sample cricket data' },
      football: { status: 'mock-data', message: 'Using sample football data' }
    },
    endpoints: {
      total: 8,
      active: 8,
      description: 'All endpoints returning mock data for development'
    },
    timestamp: Date.now()
  });
});

console.log('🚀 MatchArena Functions loaded successfully with mock data!');
