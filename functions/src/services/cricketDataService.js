const admin = require('firebase-admin');
const functions = require('firebase-functions');
const axios = require('axios');
const logger = require('../utils/logger');

class CricketDataService {
  constructor() {
    this.baseURL = 'https://api.cricapi.com/v1';
    this.apiKey = functions.config().cric?.api_key || 'bdc46755-7e68-459e-a2ab-b79ad1d50554';
    this.rateLimitDelay = 1000; // 1 second between requests
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.requestCount = 0;
    this.dailyLimit = 100; // Free tier limit
  }

  // Rate limiting for free tier
  checkRateLimit(endpoint) {
    const now = Date.now();
    const dailyKey = `daily_${Math.floor(now / (24 * 60 * 60 * 1000))}`;
    const minuteKey = `${endpoint}_${Math.floor(now / (60 * 1000))}`;
    
    // Check daily limit
    const dailyCount = this.rateLimitCache.get(dailyKey) || 0;
    if (dailyCount >= this.dailyLimit) {
      throw new Error('Daily API limit exceeded');
    }
    
    // Check per-minute limit (10 requests per minute per endpoint)
    const minuteCount = this.rateLimitCache.get(minuteKey) || 0;
    if (minuteCount >= 10) {
      throw new Error('Rate limit exceeded for endpoint');
    }
    
    this.rateLimitCache.set(dailyKey, dailyCount + 1);
    this.rateLimitCache.set(minuteKey, minuteCount + 1);
    return true;
  }

  // Smart caching system
  getCachedData(key, maxAge = 5 * 60 * 1000) {
    const cached = this.dataCache.get(key);
    if (cached && (Date.now() - cached.timestamp < maxAge)) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async makeRequest(endpoint, params = {}) {
    try {
      this.checkRateLimit(endpoint);
      
      const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        logger.info(`Cache hit for ${endpoint}`);
        return cached;
      }

      logger.info(`Making API request to ${endpoint}`);
      const response = await axios.get(`${this.baseURL}/${endpoint}`, {
        params: {
          api_token: this.apiKey,
          ...params
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'MatchArena/1.0'
        }
      });

      if (response.data && response.data.status === 'success') {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error(`API returned error: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error(`Cricket API Error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Get current/live matches
  async getCurrentMatches() {
    try {
      const data = await this.makeRequest('currentMatches');
      return this.normalizeMatches(data.data || []);
    } catch (error) {
      logger.error('Error fetching current matches:', error);
      return [];
    }
  }

  // Get match details with scorecard
  async getMatchInfo(matchId) {
    try {
      const data = await this.makeRequest('match_info', { id: matchId });
      return this.normalizeMatchDetail(data.data);
    } catch (error) {
      logger.error(`Error fetching match ${matchId}:`, error);
      return null;
    }
  }

  // Get live score with ball-by-ball
  async getLiveScore(matchId) {
    try {
      const data = await this.makeRequest('match_live', { id: matchId });
      return this.normalizeLiveScore(data.data);
    } catch (error) {
      logger.error(`Error fetching live score ${matchId}:`, error);
      return null;
    }
  }

  // Get series information
  async getSeries() {
    try {
      const data = await this.makeRequest('series');
      return this.normalizeSeries(data.data || []);
    } catch (error) {
      logger.error('Error fetching series:', error);
      return [];
    }
  }

  // Get series matches
  async getSeriesMatches(seriesId) {
    try {
      const data = await this.makeRequest('series_matches', { id: seriesId });
      return this.normalizeMatches(data.data || []);
    } catch (error) {
      logger.error(`Error fetching series matches ${seriesId}:`, error);
      return [];
    }
  }

  // Get series points table
  async getSeriesPoints(seriesId) {
    try {
      const data = await this.makeRequest('series_points', { id: seriesId });
      return this.normalizePointsTable(data.data || []);
    } catch (error) {
      logger.error(`Error fetching series points ${seriesId}:`, error);
      return [];
    }
  }

  // Get fantasy points for a match
  async getFantasyPoints(matchId) {
    try {
      const data = await this.makeRequest('fantasysummary', { id: matchId });
      return this.normalizeFantasyData(data.data);
    } catch (error) {
      logger.error(`Error fetching fantasy points ${matchId}:`, error);
      return null;
    }
  }

  // Normalize matches data for Asian cricket focus
  normalizeMatches(matches) {
    return matches.map(match => {
      const isAsianMatch = this.isAsianMatch(match);
      
      return {
        id: match.id,
        seriesId: match.series_id,
        seriesName: match.series,
        status: this.mapMatchStatus(match.status),
        teams: {
          home: {
            id: match.team_1_id,
            name: match.team_1,
            shortName: this.getTeamShortName(match.team_1),
            logo: match.team_1_img,
            flag: this.getTeamFlag(match.team_1)
          },
          away: {
            id: match.team_2_id,
            name: match.team_2,
            shortName: this.getTeamShortName(match.team_2),
            logo: match.team_2_img,
            flag: this.getTeamFlag(match.team_2)
          }
        },
        scores: this.parseScores(match),
        venue: match.venue,
        city: match.city,
        country: match.country,
        startsAt: new Date(match.date_start).getTime(),
        updatedAt: Date.now(),
        matchType: match.type || 'ODI',
        isAsianMatch,
        priority: isAsianMatch ? 'high' : 'medium',
        source: 'cricketdata.org',
        weather: match.weather,
        pitch: match.pitch_condition
      };
    });
  }

  // Parse cricket scores
  parseScores(match) {
    const parseTeamScore = (scoreStr, overStr) => {
      if (!scoreStr) return { runs: 0, wickets: 0, overs: 0, runRate: 0 };
      
      const parts = scoreStr.split('/');
      const runs = parseInt(parts[0]) || 0;
      const wickets = parseInt(parts[1]) || 0;
      const overs = parseFloat(overStr) || 0;
      const runRate = overs > 0 ? (runs / overs).toFixed(2) : 0;
      
      return { runs, wickets, overs, runRate };
    };

    return {
      home: parseTeamScore(match.team_1_score, match.team_1_over),
      away: parseTeamScore(match.team_2_score, match.team_2_over),
      target: match.target ? parseInt(match.target) : null,
      requiredRunRate: match.required_run_rate ? parseFloat(match.required_run_rate) : null
    };
  }

  // Normalize match details
  normalizeMatchDetail(match) {
    if (!match) return null;

    return {
      ...this.normalizeMatches([match])[0],
      tossWinner: match.toss_winner_team,
      tossDecision: match.toss_winner_decision,
      result: match.status_note,
      manOfMatch: match.man_of_match,
      umpires: {
        field: match.umpires?.split(',').map(u => u.trim()) || [],
        third: match.third_umpire,
        match_referee: match.match_referee
      },
      timeline: {
        commentary: match.commentary || [],
        scorecard: match.scorecard || {},
        partnerships: match.partnerships || [],
        fallOfWickets: match.fall_of_wickets || []
      }
    };
  }

  // Normalize live score data
  normalizeLiveScore(liveData) {
    if (!liveData) return null;

    return {
      currentInnings: liveData.current_innings,
      battingTeam: liveData.batting_team,
      bowlingTeam: liveData.bowling_team,
      currentBatsmen: (liveData.batsmen || []).map(batsman => ({
        name: batsman.name,
        runs: parseInt(batsman.runs) || 0,
        balls: parseInt(batsman.balls_faced) || 0,
        fours: parseInt(batsman.fours) || 0,
        sixes: parseInt(batsman.sixes) || 0,
        strikeRate: batsman.strike_rate ? parseFloat(batsman.strike_rate) : 0,
        isOnStrike: batsman.on_strike === 'true'
      })),
      currentBowler: liveData.bowler ? {
        name: liveData.bowler.name,
        overs: parseFloat(liveData.bowler.overs) || 0,
        maidens: parseInt(liveData.bowler.maidens) || 0,
        runs: parseInt(liveData.bowler.runs) || 0,
        wickets: parseInt(liveData.bowler.wickets) || 0,
        economy: liveData.bowler.economy ? parseFloat(liveData.bowler.economy) : 0
      } : null,
      recentOvers: liveData.recent_overs || [],
      commentary: (liveData.commentary || []).slice(0, 10), // Latest 10 comments
      lastWicket: liveData.last_wicket,
      partnership: liveData.partnership ? {
        runs: parseInt(liveData.partnership.runs) || 0,
        balls: parseInt(liveData.partnership.balls) || 0
      } : null,
      updatedAt: Date.now()
    };
  }

  // Normalize series data
  normalizeSeries(series) {
    return series.map(s => ({
      id: s.id,
      name: s.name,
      season: s.season,
      startsAt: new Date(s.date_start).getTime(),
      endsAt: new Date(s.date_end).getTime(),
      teams: s.teams || [],
      totalMatches: {
        odi: parseInt(s.odi) || 0,
        t20: parseInt(s.t20) || 0,
        test: parseInt(s.test) || 0
      },
      format: this.determineSeriesFormat(s),
      isAsianSeries: this.isAsianSeries(s),
      priority: this.isAsianSeries(s) ? 'high' : 'medium'
    }));
  }

  // Normalize points table
  normalizePointsTable(pointsData) {
    return pointsData.map(team => ({
      position: parseInt(team.position) || 0,
      teamName: team.team,
      played: parseInt(team.played) || 0,
      won: parseInt(team.won) || 0,
      lost: parseInt(team.lost) || 0,
      tied: parseInt(team.tied) || 0,
      noResult: parseInt(team.no_result) || 0,
      points: parseInt(team.points) || 0,
      netRunRate: parseFloat(team.net_run_rate) || 0,
      form: team.form || []
    }));
  }

  // Normalize fantasy data
  normalizeFantasyData(fantasyData) {
    if (!fantasyData) return null;

    return {
      players: (fantasyData.players || []).map(player => ({
        name: player.name,
        team: player.team,
        role: player.role,
        points: parseFloat(player.points) || 0,
        credits: parseFloat(player.credits) || 0,
        selectedBy: parseFloat(player.selected_by) || 0,
        battingStats: {
          runs: parseInt(player.runs) || 0,
          balls: parseInt(player.balls_faced) || 0,
          fours: parseInt(player.fours) || 0,
          sixes: parseInt(player.sixes) || 0
        },
        bowlingStats: {
          overs: parseFloat(player.overs) || 0,
          wickets: parseInt(player.wickets) || 0,
          runs: parseInt(player.runs_conceded) || 0,
          economy: parseFloat(player.economy) || 0
        },
        fieldingStats: {
          catches: parseInt(player.catches) || 0,
          runOuts: parseInt(player.run_outs) || 0,
          stumpings: parseInt(player.stumpings) || 0
        }
      })),
      updatedAt: Date.now()
    };
  }

  // Helper methods for Asian cricket focus
  isAsianMatch(match) {
    const asianTeams = [
      'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Afghanistan',
      'Nepal', 'Hong Kong', 'UAE', 'Malaysia', 'Singapore', 'Thailand',
      'Japan', 'South Korea', 'China', 'Myanmar', 'Bhutan', 'Maldives'
    ];
    
    return asianTeams.some(team => 
      match.team_1?.includes(team) || match.team_2?.includes(team)
    );
  }

  isAsianSeries(series) {
    const asianSeries = [
      'IPL', 'Asia Cup', 'PSL', 'BPL', 'LPL', 'CPL', 'T20 Blast',
      'Indian Premier League', 'Pakistan Super League', 'Bangladesh Premier League',
      'Lanka Premier League', 'Afghanistan Premier League', 'Hong Kong T20',
      'Malaysia Cricket', 'Singapore Cricket', 'Thailand Cricket'
    ];
    
    return asianSeries.some(s => series.name?.toLowerCase().includes(s.toLowerCase()));
  }

  getTeamShortName(teamName) {
    const shortNames = {
      'India': 'IND', 'Pakistan': 'PAK', 'Bangladesh': 'BAN', 'Sri Lanka': 'SL',
      'Afghanistan': 'AFG', 'Nepal': 'NEP', 'Hong Kong': 'HK', 'UAE': 'UAE',
      'Malaysia': 'MAL', 'Singapore': 'SIN', 'Thailand': 'THA', 'Japan': 'JPN',
      'South Korea': 'KOR', 'China': 'CHN', 'Myanmar': 'MYA'
    };
    
    return shortNames[teamName] || teamName?.substring(0, 3)?.toUpperCase() || 'TBD';
  }

  getTeamFlag(teamName) {
    const flags = {
      'India': '🇮🇳', 'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Sri Lanka': '🇱🇰',
      'Afghanistan': '🇦🇫', 'Nepal': '🇳🇵', 'Hong Kong': '🇭🇰', 'UAE': '🇦🇪',
      'Malaysia': '🇲🇾', 'Singapore': '🇸🇬', 'Thailand': '🇹🇭', 'Japan': '🇯🇵',
      'South Korea': '🇰🇷', 'China': '🇨🇳', 'Myanmar': '🇲🇲'
    };
    
    return flags[teamName] || '🏏';
  }

  determineSeriesFormat(series) {
    const odi = parseInt(series.odi) || 0;
    const t20 = parseInt(series.t20) || 0;
    const test = parseInt(series.test) || 0;
    
    if (odi > 0 && t20 > 0 && test > 0) return 'Multi-Format';
    if (odi > 0) return 'ODI';
    if (t20 > 0) return 'T20';
    if (test > 0) return 'Test';
    return 'Unknown';
  }

  mapMatchStatus(apiStatus) {
    const statusMap = {
      'Scheduled': 'upcoming',
      'Live': 'live',
      'Completed': 'completed',
      'Abandoned': 'cancelled',
      'No Result': 'no_result'
    };
    return statusMap[apiStatus] || 'upcoming';
  }
}

module.exports = CricketDataService;
