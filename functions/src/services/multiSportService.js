const admin = require('firebase-admin');
const functions = require('firebase-functions');
const axios = require('axios');
const logger = require('../utils/logger');

class MultiSportService {
  constructor() {
    this.baseURL = 'https://v1.basketball.api-sports.io'; // Will switch based on sport
    this.rapidAPIKey = functions.config().sports?.api_key || 'd11dca33082525388b3b094a8f4b31ae'; // Same key for all API-Sports endpoints
    this.rateLimitCache = new Map();
    this.dataCache = new Map();
    this.requestCount = 0;
    this.dailyLimit = 100;
    
    // Asian leagues/competitions for different sports
    this.asianCompetitions = {
      basketball: {
        // Asian Basketball leagues
        12: 'NBA', // Include for Asian players
        127: 'CBA (China)',
        146: 'B.League (Japan)',
        147: 'KBL (South Korea)',
        148: 'PBA (Philippines)',
        149: 'ABL (ASEAN)',
        150: 'SBL (Taiwan)',
        151: 'NBL (Australia)',
        152: 'FIBA Asia Cup'
      },
      tennis: {
        // Major tournaments with Asian participation
        1: 'ATP Tour',
        2: 'WTA Tour',
        3: 'Grand Slams',
        4: 'Davis Cup',
        5: 'Fed Cup',
        // Asian specific tournaments
        6: 'ATP Shanghai Masters',
        7: 'WTA Beijing',
        8: 'ATP Tokyo',
        9: 'WTA Tokyo'
      },
      volleyball: {
        // Asian volleyball leagues
        1: 'FIVB World Championship',
        2: 'Asian Games Volleyball',
        3: 'V.League (Japan)',
        4: 'KOVO (South Korea)',
        5: 'Chinese Volleyball League',
        6: 'PVL (Philippines)',
        7: 'Thai League'
      },
      badminton: {
        // BWF tournaments popular in Asia
        1: 'BWF World Championships',
        2: 'All England Open',
        3: 'Thomas Cup',
        4: 'Uber Cup',
        5: 'Sudirman Cup',
        6: 'Asian Games',
        7: 'Indonesia Open',
        8: 'Malaysia Open',
        9: 'China Open',
        10: 'Japan Open',
        11: 'Korea Open',
        12: 'India Open',
        13: 'Thailand Open',
        14: 'Singapore Open'
      }
    };
  }

  // Rate limiting (shared with football service)
  checkRateLimit(endpoint) {
    const now = Date.now();
    const dailyKey = `daily_${Math.floor(now / (24 * 60 * 60 * 1000))}`;
    const minuteKey = `${endpoint}_${Math.floor(now / (60 * 1000))}`;
    
    const dailyCount = this.rateLimitCache.get(dailyKey) || 0;
    if (dailyCount >= this.dailyLimit) {
      throw new Error('Daily API limit exceeded');
    }
    
    const minuteCount = this.rateLimitCache.get(minuteKey) || 0;
    if (minuteCount >= 8) { // Slightly lower for multi-sport
      throw new Error('Rate limit exceeded for endpoint');
    }
    
    this.rateLimitCache.set(dailyKey, dailyCount + 1);
    this.rateLimitCache.set(minuteKey, minuteCount + 1);
    return true;
  }

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

  async makeRequest(sport, endpoint, params = {}) {
    try {
      this.checkRateLimit(`${sport}_${endpoint}`);
      
      const cacheKey = `${sport}_${endpoint}_${JSON.stringify(params)}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        logger.info(`Cache hit for ${sport} ${endpoint}`);
        return cached;
      }

      // Set base URL based on sport
      const baseURLs = {
        basketball: 'https://v1.basketball.api-sports.io',
        tennis: 'https://v1.tennis.api-sports.io',
        volleyball: 'https://v1.volleyball.api-sports.io',
        handball: 'https://v1.handball.api-sports.io',
        hockey: 'https://v1.hockey.api-sports.io'
      };

      const baseURL = baseURLs[sport] || this.baseURL;
      
      logger.info(`Making ${sport} API request to ${endpoint}`);
      const response = await axios.get(`${baseURL}/${endpoint}`, {
        params,
        timeout: 15000,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': baseURL.replace('https://', '')
        }
      });

      if (response.data && response.data.response) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error(`API returned error: ${response.data?.errors || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error(`${sport} API Error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // BASKETBALL METHODS
  async getBasketballGames(date = null) {
    try {
      const params = {};
      if (date) params.date = date;
      
      const data = await this.makeRequest('basketball', 'games', params);
      return this.normalizeBasketballGames(data.response || []);
    } catch (error) {
      logger.error('Error fetching basketball games:', error);
      return [];
    }
  }

  async getBasketballLeagueStandings(leagueId, season) {
    try {
      const data = await this.makeRequest('basketball', 'standings', {
        league: leagueId,
        season: season
      });
      return this.normalizeBasketballStandings(data.response || []);
    } catch (error) {
      logger.error('Error fetching basketball standings:', error);
      return [];
    }
  }

  normalizeBasketballGames(games) {
    return games.map(game => ({
      id: game.id,
      sport: 'basketball',
      league: {
        id: game.league.id,
        name: game.league.name,
        type: game.league.type,
        season: game.league.season,
        logo: game.league.logo
      },
      teams: {
        home: {
          id: game.teams.home.id,
          name: game.teams.home.name,
          logo: game.teams.home.logo
        },
        away: {
          id: game.teams.away.id,
          name: game.teams.away.name,
          logo: game.teams.away.logo
        }
      },
      scores: {
        home: {
          quarter_1: game.scores.home.quarter_1,
          quarter_2: game.scores.home.quarter_2,
          quarter_3: game.scores.home.quarter_3,
          quarter_4: game.scores.home.quarter_4,
          over_time: game.scores.home.over_time,
          total: game.scores.home.total
        },
        away: {
          quarter_1: game.scores.away.quarter_1,
          quarter_2: game.scores.away.quarter_2,
          quarter_3: game.scores.away.quarter_3,
          quarter_4: game.scores.away.quarter_4,
          over_time: game.scores.away.over_time,
          total: game.scores.away.total
        }
      },
      status: this.mapBasketballStatus(game.status.short),
      date: new Date(game.date).getTime(),
      time: game.time,
      timezone: game.timezone,
      venue: game.venue,
      isAsianMatch: this.isAsianBasketballLeague(game.league.id),
      priority: this.isAsianBasketballLeague(game.league.id) ? 'high' : 'medium',
      source: 'api-sports.io'
    }));
  }

  normalizeBasketballStandings(standings) {
    return standings.map(standing => ({
      position: standing.position,
      team: {
        id: standing.team.id,
        name: standing.team.name,
        logo: standing.team.logo
      },
      league: {
        id: standing.league.id,
        name: standing.league.name,
        season: standing.league.season
      },
      games: {
        played: standing.games.played,
        win: {
          total: standing.games.win.total,
          percentage: standing.games.win.percentage
        },
        lose: {
          total: standing.games.lose.total,
          percentage: standing.games.lose.percentage
        }
      },
      points: {
        for: standing.points.for,
        against: standing.points.against
      },
      form: standing.form,
      description: standing.description
    }));
  }

  // TENNIS METHODS (Simulated - as tennis API might have different structure)
  async getTennisMatches(date = null) {
    try {
      // This would be implemented based on actual tennis API structure
      // For now, returning mock data structure for Asian tournaments
      return this.getMockTennisData();
    } catch (error) {
      logger.error('Error fetching tennis matches:', error);
      return [];
    }
  }

  getMockTennisData() {
    // Mock data for major Asian tennis tournaments
    return [
      {
        id: 'atp_shanghai_2024',
        sport: 'tennis',
        tournament: 'ATP Shanghai Masters',
        round: 'Quarter Finals',
        players: {
          player1: {
            name: 'Novak Djokovic',
            country: 'Serbia',
            ranking: 1,
            flag: '🇷🇸'
          },
          player2: {
            name: 'Carlos Alcaraz',
            country: 'Spain',
            ranking: 2,
            flag: '🇪🇸'
          }
        },
        scores: {
          sets: [
            { player1: 6, player2: 4 },
            { player1: 3, player2: 6 },
            { player1: 6, player2: 2 }
          ],
          currentSet: { player1: 0, player2: 0 }
        },
        status: 'completed',
        surface: 'Hard',
        venue: 'Shanghai, China',
        isAsianTournament: true,
        priority: 'high',
        source: 'mock-data'
      }
    ];
  }

  // BADMINTON METHODS (Mock implementation for Asian focus)
  async getBadmintonMatches() {
    try {
      return this.getMockBadmintonData();
    } catch (error) {
      logger.error('Error fetching badminton matches:', error);
      return [];
    }
  }

  getMockBadmintonData() {
    return [
      {
        id: 'bwf_indonesia_open_2024',
        sport: 'badminton',
        tournament: 'Indonesia Open',
        category: 'Men\'s Singles',
        round: 'Final',
        players: {
          player1: {
            name: 'Viktor Axelsen',
            country: 'Denmark',
            ranking: 1,
            flag: '🇩🇰'
          },
          player2: {
            name: 'Kento Momota',
            country: 'Japan',
            ranking: 3,
            flag: '🇯🇵'
          }
        },
        scores: {
          games: [
            { player1: 21, player2: 18 },
            { player1: 19, player2: 21 },
            { player1: 21, player2: 16 }
          ]
        },
        status: 'completed',
        venue: 'Jakarta, Indonesia',
        isAsianTournament: true,
        priority: 'high',
        source: 'mock-data'
      },
      {
        id: 'bwf_malaysia_open_2024',
        sport: 'badminton',
        tournament: 'Malaysia Open',
        category: 'Women\'s Singles',
        round: 'Semi Final',
        players: {
          player1: {
            name: 'Tai Tzu-ying',
            country: 'Taiwan',
            ranking: 1,
            flag: '🇹🇼'
          },
          player2: {
            name: 'Carolina Marin',
            country: 'Spain',
            ranking: 2,
            flag: '🇪🇸'
          }
        },
        scores: {
          games: [
            { player1: 21, player2: 15 },
            { player1: 18, player2: 21 },
            { player1: 0, player2: 0 } // Current game
          ]
        },
        status: 'live',
        venue: 'Kuala Lumpur, Malaysia',
        isAsianTournament: true,
        priority: 'high',
        source: 'mock-data'
      }
    ];
  }

  // TABLE TENNIS METHODS (Mock implementation)
  async getTableTennisMatches() {
    try {
      return this.getMockTableTennisData();
    } catch (error) {
      logger.error('Error fetching table tennis matches:', error);
      return [];
    }
  }

  getMockTableTennisData() {
    return [
      {
        id: 'wtt_china_smash_2024',
        sport: 'table_tennis',
        tournament: 'WTT China Smash',
        category: 'Men\'s Singles',
        round: 'Final',
        players: {
          player1: {
            name: 'Fan Zhendong',
            country: 'China',
            ranking: 1,
            flag: '🇨🇳'
          },
          player2: {
            name: 'Tomokazu Harimoto',
            country: 'Japan',
            ranking: 4,
            flag: '🇯🇵'
          }
        },
        scores: {
          games: [
            { player1: 11, player2: 8 },
            { player1: 11, player2: 9 },
            { player1: 9, player2: 11 },
            { player1: 11, player2: 6 }
          ]
        },
        status: 'completed',
        venue: 'Beijing, China',
        isAsianTournament: true,
        priority: 'high',
        source: 'mock-data'
      }
    ];
  }

  // VOLLEYBALL METHODS (Mock implementation)
  async getVolleyballMatches() {
    try {
      return this.getMockVolleyballData();
    } catch (error) {
      logger.error('Error fetching volleyball matches:', error);
      return [];
    }
  }

  getMockVolleyballData() {
    return [
      {
        id: 'vleague_japan_2024',
        sport: 'volleyball',
        league: 'V.League Division 1 (Japan)',
        teams: {
          home: {
            name: 'JT Thunders',
            city: 'Hiroshima',
            logo: null
          },
          away: {
            name: 'Panasonic Panthers',
            city: 'Osaka',
            logo: null
          }
        },
        scores: {
          sets: [
            { home: 25, away: 22 },
            { home: 23, away: 25 },
            { home: 25, away: 18 },
            { home: 25, away: 20 }
          ]
        },
        status: 'completed',
        venue: 'Hiroshima, Japan',
        isAsianMatch: true,
        priority: 'high',
        source: 'mock-data'
      }
    ];
  }

  // Helper methods
  isAsianBasketballLeague(leagueId) {
    return Object.prototype.hasOwnProperty.call(this.asianCompetitions.basketball, leagueId);
  }

  mapBasketballStatus(apiStatus) {
    const statusMap = {
      'NS': 'upcoming',
      '1Q': 'live',
      '2Q': 'live',
      'HT': 'live',
      '3Q': 'live',
      '4Q': 'live',
      'OT': 'live',
      'FT': 'completed',
      'AOT': 'completed',
      'POST': 'postponed',
      'CANC': 'cancelled',
      'ABD': 'abandoned'
    };
    return statusMap[apiStatus] || 'upcoming';
  }

  // Unified method to get all sports data
  async getAllSportsData() {
    try {
      const [basketball, tennis, badminton, tableTennis, volleyball] = await Promise.allSettled([
        this.getBasketballGames(),
        this.getTennisMatches(),
        this.getBadmintonMatches(),
        this.getTableTennisMatches(),
        this.getVolleyballMatches()
      ]);

      return {
        basketball: basketball.status === 'fulfilled' ? basketball.value : [],
        tennis: tennis.status === 'fulfilled' ? tennis.value : [],
        badminton: badminton.status === 'fulfilled' ? badminton.value : [],
        tableTennis: tableTennis.status === 'fulfilled' ? tableTennis.value : [],
        volleyball: volleyball.status === 'fulfilled' ? volleyball.value : []
      };
    } catch (error) {
      logger.error('Error fetching all sports data:', error);
      return {
        basketball: [],
        tennis: [],
        badminton: [],
        tableTennis: [],
        volleyball: []
      };
    }
  }
}

module.exports = MultiSportService;
