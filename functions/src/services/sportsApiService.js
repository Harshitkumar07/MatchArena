/**
 * Secure Sports API Service for Firebase Functions
 * Handles all external API calls using server-side API keys
 */

const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');

class SportsAPIService {
  constructor() {
    // Get API keys from Firebase Functions config (secure)
    this.cricketApiKey = functions.config().cricket?.api_key || process.env.CRICKET_API_KEY;
    this.footballApiKey = functions.config().football?.api_key || process.env.FOOTBALL_API_KEY;
    
    // API Base URLs
    this.cricketBaseURL = 'https://api.cricapi.com/v1';
    this.footballBaseURL = 'https://v3.football.api-sports.io';
    
    // Cache for API responses (5 minutes for live, 30 minutes for others)
    this.cache = new Map();
    this.liveCacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.standardCacheTimeout = 30 * 60 * 1000; // 30 minutes
    
    // Initialize Firebase Database reference
    this.db = admin.database();
  }

  // Generic cache method
  async getCached(key, fetchFunction, timeout = this.standardCacheTimeout) {
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < timeout) {
        console.log(`Cache hit for: ${key}`);
        return cached.data;
      }
    }

    try {
      const data = await fetchFunction();
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      // Return stale cache if available
      if (this.cache.has(key)) {
        console.warn(`Using stale cache for: ${key}, Error: ${error.message}`);
        return this.cache.get(key).data;
      }
      throw error;
    }
  }

  // ============ CRICKET API METHODS ============

  async getCricketMatches(type = 'all') {
    const cacheKey = `cricket_matches_${type}`;
    
    return this.getCached(cacheKey, async () => {
      const endpoints = {
        live: `${this.cricketBaseURL}/currentMatches`,
        upcoming: `${this.cricketBaseURL}/matches`,
        recent: `${this.cricketBaseURL}/matches`
      };

      const response = await axios.get(endpoints[type] || endpoints.live, {
        params: {
          apikey: this.cricketApiKey,
          offset: 0
        },
        headers: {
          'User-Agent': 'MatchArena/1.0'
        }
      });

      if (response.data.status !== 'success') {
        throw new Error(`Cricket API Error: ${response.data.status}`);
      }

      // Transform and filter matches
      const matches = response.data.data.map(match => this.transformCricketMatch(match));
      
      // Filter based on type
      if (type === 'live') {
        return matches.filter(m => m.status === 'live');
      } else if (type === 'upcoming') {
        return matches.filter(m => m.status === 'upcoming');
      } else if (type === 'recent') {
        return matches.filter(m => m.status === 'completed');
      }
      
      return matches;
    }, type === 'live' ? this.liveCacheTimeout : this.standardCacheTimeout);
  }

  async getCricketMatchDetail(matchId) {
    const cacheKey = `cricket_match_${matchId}`;
    
    return this.getCached(cacheKey, async () => {
      const response = await axios.get(`${this.cricketBaseURL}/match_info`, {
        params: {
          apikey: this.cricketApiKey,
          id: matchId
        }
      });

      if (response.data.status !== 'success') {
        throw new Error(`Cricket Match Detail Error: ${response.data.status}`);
      }

      return this.transformCricketMatch(response.data.data, true);
    }, this.liveCacheTimeout);
  }

  async getCricketSeries() {
    const cacheKey = 'cricket_series';
    
    return this.getCached(cacheKey, async () => {
      const response = await axios.get(`${this.cricketBaseURL}/series`, {
        params: {
          apikey: this.cricketApiKey,
          offset: 0
        }
      });

      if (response.data.status !== 'success') {
        throw new Error(`Cricket Series Error: ${response.data.status}`);
      }

      return response.data.data.map(series => this.transformCricketSeries(series));
    });
  }

  // ============ FOOTBALL API METHODS (20+ Sports) ============

  async getFootballFixtures(sport = 'football', league = null, season = null) {
    const cacheKey = `${sport}_fixtures_${league || 'all'}_${season || 'current'}`;
    
    return this.getCached(cacheKey, async () => {
      const params = {
        timezone: 'UTC'
      };

      if (league) params.league = league;
      if (season) params.season = season;

      const response = await axios.get(`${this.footballBaseURL}/fixtures`, {
        params,
        headers: {
          'X-RapidAPI-Key': this.footballApiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      });

      if (!response.data.response) {
        throw new Error(`${sport} API Error: No data received`);
      }

      return response.data.response.map(fixture => this.transformFootballFixture(fixture, sport));
    }, this.liveCacheTimeout);
  }

  async getFootballLeagues(sport = 'football') {
    const cacheKey = `${sport}_leagues`;
    
    return this.getCached(cacheKey, async () => {
      const response = await axios.get(`${this.footballBaseURL}/leagues`, {
        headers: {
          'X-RapidAPI-Key': this.footballApiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      });

      return response.data.response.map(league => ({
        id: league.league.id,
        name: league.league.name,
        country: league.country.name,
        logo: league.league.logo,
        flag: league.country.flag,
        season: league.seasons[league.seasons.length - 1],
        sport: sport
      }));
    });
  }

  async getSportsList() {
    // API-Football supports these sports (free tier)
    return [
      { id: 'football', name: 'Football', icon: '⚽', endpoint: 'football' },
      { id: 'basketball', name: 'Basketball', icon: '🏀', endpoint: 'basketball' },
      { id: 'hockey', name: 'Hockey', icon: '🏒', endpoint: 'hockey' },
      { id: 'handball', name: 'Handball', icon: '🤾', endpoint: 'handball' },
      { id: 'volleyball', name: 'Volleyball', icon: '🏐', endpoint: 'volleyball' },
      { id: 'rugby', name: 'Rugby', icon: '🏈', endpoint: 'rugby' },
      { id: 'tennis', name: 'Tennis', icon: '🎾', endpoint: 'tennis' },
      { id: 'mma', name: 'MMA', icon: '🥊', endpoint: 'mma' },
      { id: 'boxing', name: 'Boxing', icon: '🥊', endpoint: 'boxing' },
      { id: 'motorsport', name: 'Motorsport', icon: '🏎️', endpoint: 'motorsport' },
      { id: 'cycling', name: 'Cycling', icon: '🚴', endpoint: 'cycling' },
      { id: 'golf', name: 'Golf', icon: '⛳', endpoint: 'golf' },
      { id: 'baseball', name: 'Baseball', icon: '⚾', endpoint: 'baseball' },
      { id: 'american-football', name: 'American Football', icon: '🏈', endpoint: 'american-football' }
    ];
  }

  // ============ TRANSFORMATION METHODS ============

  transformCricketMatch(match, detailed = false) {
    const transformed = {
      id: match.id,
      sport: 'cricket',
      name: match.name,
      matchType: match.matchType || 'Unknown',
      status: this.getCricketMatchStatus(match.status),
      teams: {
        home: {
          id: match.teamInfo?.[0]?.shortname || match.teams?.[0] || 'TBD',
          name: match.teamInfo?.[0]?.name || match.teams?.[0] || 'TBD',
          shortName: match.teamInfo?.[0]?.shortname || match.teams?.[0] || 'TBD',
          logo: match.teamInfo?.[0]?.img || null
        },
        away: {
          id: match.teamInfo?.[1]?.shortname || match.teams?.[1] || 'TBD',
          name: match.teamInfo?.[1]?.name || match.teams?.[1] || 'TBD', 
          shortName: match.teamInfo?.[1]?.shortname || match.teams?.[1] || 'TBD',
          logo: match.teamInfo?.[1]?.img || null
        }
      },
      venue: match.venue || 'TBD',
      startsAt: new Date(match.dateTimeGMT).getTime(),
      updatedAt: Date.now(),
      series: {
        id: match.series_id,
        name: match.series
      }
    };

    if (match.score && match.score.length > 0) {
      transformed.scores = this.parseCricketScores(match.score);
    }

    if (detailed && match.commentary) {
      transformed.commentary = match.commentary;
      transformed.scorecard = match.scorecard;
    }

    return transformed;
  }

  transformFootballFixture(fixture, sport) {
    return {
      id: fixture.fixture.id,
      sport: sport,
      status: this.getFootballMatchStatus(fixture.fixture.status.short),
      teams: {
        home: {
          id: fixture.teams.home.id,
          name: fixture.teams.home.name,
          logo: fixture.teams.home.logo
        },
        away: {
          id: fixture.teams.away.id,
          name: fixture.teams.away.name,
          logo: fixture.teams.away.logo
        }
      },
      scores: {
        home: fixture.goals?.home || 0,
        away: fixture.goals?.away || 0
      },
      venue: {
        name: fixture.fixture.venue.name,
        city: fixture.fixture.venue.city
      },
      league: {
        id: fixture.league.id,
        name: fixture.league.name,
        country: fixture.league.country,
        logo: fixture.league.logo,
        flag: fixture.league.flag
      },
      startsAt: new Date(fixture.fixture.date).getTime(),
      updatedAt: Date.now()
    };
  }

  transformCricketSeries(series) {
    return {
      id: series.id,
      name: series.name,
      startDate: new Date(series.startDate).getTime(),
      endDate: new Date(series.endDate).getTime(),
      sport: 'cricket',
      matches: series.matches || [],
      status: series.status || 'ongoing'
    };
  }

  // ============ HELPER METHODS ============

  getCricketMatchStatus(status) {
    const statusMap = {
      'Match not started': 'upcoming',
      'Toss': 'upcoming', 
      'Live': 'live',
      'Innings Break': 'live',
      'Match Finished': 'completed',
      'Match Cancelled': 'cancelled',
      'No result': 'completed'
    };
    return statusMap[status] || 'unknown';
  }

  getFootballMatchStatus(status) {
    const statusMap = {
      'NS': 'upcoming',      // Not Started
      'LIVE': 'live',        // Live
      '1H': 'live',          // First Half
      '2H': 'live',          // Second Half
      'HT': 'live',          // Halftime
      'FT': 'completed',     // Full Time
      'AET': 'completed',    // After Extra Time
      'PEN': 'completed',    // Penalty Shootout
      'CANC': 'cancelled',   // Cancelled
      'SUSP': 'suspended',   // Suspended
      'POSTP': 'postponed'   // Postponed
    };
    return statusMap[status] || 'unknown';
  }

  parseCricketScores(scoreArray) {
    const scores = { home: {}, away: {} };
    
    if (scoreArray.length >= 1) {
      const homeScore = scoreArray[0];
      scores.home = {
        runs: homeScore.r || 0,
        wickets: homeScore.w || 0,
        overs: homeScore.o || 0
      };
    }
    
    if (scoreArray.length >= 2) {
      const awayScore = scoreArray[1];
      scores.away = {
        runs: awayScore.r || 0,
        wickets: awayScore.w || 0,
        overs: awayScore.o || 0
      };
    }
    
    return scores;
  }

  // ============ SYNC METHODS FOR FIREBASE ============

  async syncLiveMatchesToFirebase() {
    try {
      console.log('Syncing live matches to Firebase...');
      
      // Get cricket matches
      const cricketMatches = await this.getCricketMatches('live');
      
      // Get football matches (you can expand this for other sports)
      const footballMatches = await this.getFootballFixtures('football');
      const liveFootball = footballMatches.filter(m => m.status === 'live');
      
      // Combine all live matches
      const allLiveMatches = [...cricketMatches, ...liveFootball];
      
      // Update Firebase
      const updates = {};
      allLiveMatches.forEach(match => {
        updates[`matches/${match.sport}/${match.id}`] = {
          ...match,
          lastSync: admin.database.ServerValue.TIMESTAMP
        };
      });
      
      await this.db.ref().update(updates);
      
      console.log(`Synced ${allLiveMatches.length} live matches to Firebase`);
      return allLiveMatches;
      
    } catch (error) {
      console.error('Error syncing live matches:', error);
      throw error;
    }
  }

  async syncUpcomingMatchesToFirebase() {
    try {
      console.log('Syncing upcoming matches to Firebase...');
      
      const cricketMatches = await this.getCricketMatches('upcoming');
      const footballMatches = await this.getFootballFixtures('football');
      const upcomingFootball = footballMatches.filter(m => m.status === 'upcoming');
      
      const allUpcomingMatches = [...cricketMatches, ...upcomingFootball];
      
      const updates = {};
      allUpcomingMatches.forEach(match => {
        updates[`matches/${match.sport}/${match.id}`] = {
          ...match,
          lastSync: admin.database.ServerValue.TIMESTAMP
        };
      });
      
      await this.db.ref().update(updates);
      
      console.log(`Synced ${allUpcomingMatches.length} upcoming matches to Firebase`);
      return allUpcomingMatches;
      
    } catch (error) {
      console.error('Error syncing upcoming matches:', error);
      throw error;
    }
  }

  async syncSeriesToFirebase() {
    try {
      console.log('Syncing series data to Firebase...');
      
      const cricketSeries = await this.getCricketSeries();
      const footballLeagues = await this.getFootballLeagues('football');
      
      const updates = {};
      
      // Add cricket series
      cricketSeries.forEach(series => {
        updates[`series/cricket/${series.id}`] = {
          ...series,
          lastSync: admin.database.ServerValue.TIMESTAMP
        };
      });
      
      // Add football leagues
      footballLeagues.forEach(league => {
        updates[`series/football/${league.id}`] = {
          ...league,
          lastSync: admin.database.ServerValue.TIMESTAMP
        };
      });
      
      await this.db.ref().update(updates);
      
      console.log(`Synced ${cricketSeries.length + footballLeagues.length} series/leagues to Firebase`);
      
    } catch (error) {
      console.error('Error syncing series:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new SportsAPIService();
