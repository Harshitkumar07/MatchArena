const admin = require('firebase-admin');
const functions = require('firebase-functions');
const axios = require('axios');
const logger = require('../utils/logger');

class FootballApiService {
  constructor() {
    this.rapidAPIKey = functions.config().football?.api_key || 'd11dca33082525388b3b094a8f4b31ae';
    this.apiKey = process.env.FOOTBALL_API_KEY;
    this.baseURL = 'https://v3.football.api-sports.io';
    this.rateLimitCache = new Map();
    this.dataCache = new Map();
    this.requestCount = 0;
    this.dailyLimit = 100; // Free tier limit
    
    // Asian leagues priority mapping
    this.asianLeagues = {
      // India
      323: 'Indian Super League',
      324: 'I-League',
      // Japan
      98: 'J1 League',
      99: 'J2 League',
      100: 'J3 League',
      // South Korea
      292: 'K League 1',
      293: 'K League 2',
      // China
      169: 'Chinese Super League',
      170: 'China League One',
      // Thailand
      271: 'Thai League 1',
      272: 'Thai League 2',
      // Malaysia
      188: 'Malaysia Super League',
      // Singapore
      269: 'Singapore Premier League',
      // Indonesia
      341: 'Liga 1',
      // Vietnam
      340: 'V.League 1',
      // Australia (Asia-Pacific)
      189: 'A-League Men',
      // AFC Competitions
      1: 'AFC Champions League',
      16: 'AFC Cup',
      17: 'Asian Cup'
    };
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
    
    // Check per-minute limit (10 requests per minute)
    const minuteCount = this.rateLimitCache.get(minuteKey) || 0;
    if (minuteCount >= 10) {
      throw new Error('Rate limit exceeded for endpoint');
    }
    
    this.rateLimitCache.set(dailyKey, dailyCount + 1);
    this.rateLimitCache.set(minuteKey, minuteCount + 1);
    return true;
  }

  // Smart caching system
  getCachedData(key, maxAge = 3 * 60 * 1000) { // 3 minutes for football
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

      logger.info(`Making Football API request to ${endpoint}`);
      const response = await axios.get(`${this.baseURL}/${endpoint}`, {
        params,
        timeout: 15000,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io'
        }
      });

      if (response.data && response.data.response) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error(`API returned error: ${response.data?.errors || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error(`Football API Error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Get live matches for Asian leagues
  async getLiveMatches() {
    try {
      const asianLeagueIds = Object.keys(this.asianLeagues).join(',');
      const data = await this.makeRequest('fixtures', {
        live: 'all',
        league: asianLeagueIds
      });
      
      return this.normalizeMatches(data.response || []);
    } catch (error) {
      logger.error('Error fetching live football matches:', error);
      return [];
    }
  }

  // Get today's fixtures for Asian leagues
  async getTodayFixtures() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const asianLeagueIds = Object.keys(this.asianLeagues).join(',');
      
      const data = await this.makeRequest('fixtures', {
        date: today,
        league: asianLeagueIds
      });
      
      return this.normalizeMatches(data.response || []);
    } catch (error) {
      logger.error('Error fetching today fixtures:', error);
      return [];
    }
  }

  // Get fixtures by date range
  async getFixtures(from, to, leagueId = null) {
    try {
      const params = { from, to };
      if (leagueId) {
        params.league = leagueId;
      } else {
        params.league = Object.keys(this.asianLeagues).join(',');
      }
      
      const data = await this.makeRequest('fixtures', params);
      return this.normalizeMatches(data.response || []);
    } catch (error) {
      logger.error('Error fetching fixtures:', error);
      return [];
    }
  }

  // Get match details with statistics
  async getMatchDetail(fixtureId) {
    try {
      const [fixtureData, statisticsData, eventsData] = await Promise.all([
        this.makeRequest('fixtures', { id: fixtureId }),
        this.makeRequest('fixtures/statistics', { fixture: fixtureId }).catch(() => ({ response: [] })),
        this.makeRequest('fixtures/events', { fixture: fixtureId }).catch(() => ({ response: [] }))
      ]);

      if (fixtureData.response && fixtureData.response.length > 0) {
        const match = fixtureData.response[0];
        return this.normalizeMatchDetail(match, statisticsData.response, eventsData.response);
      }
      return null;
    } catch (error) {
      logger.error(`Error fetching match detail ${fixtureId}:`, error);
      return null;
    }
  }

  // Get league standings
  async getLeagueStandings(leagueId, season = new Date().getFullYear()) {
    try {
      const data = await this.makeRequest('standings', {
        league: leagueId,
        season: season
      });
      
      return this.normalizeStandings(data.response || []);
    } catch (error) {
      logger.error(`Error fetching standings for league ${leagueId}:`, error);
      return [];
    }
  }

  // Get top scorers for a league
  async getTopScorers(leagueId, season = new Date().getFullYear()) {
    try {
      const data = await this.makeRequest('players/topscorers', {
        league: leagueId,
        season: season
      });
      
      return this.normalizeTopScorers(data.response || []);
    } catch (error) {
      logger.error(`Error fetching top scorers for league ${leagueId}:`, error);
      return [];
    }
  }

  // Get team information
  async getTeamInfo(teamId) {
    try {
      const data = await this.makeRequest('teams', { id: teamId });
      if (data.response && data.response.length > 0) {
        return this.normalizeTeamInfo(data.response[0]);
      }
      return null;
    } catch (error) {
      logger.error(`Error fetching team info ${teamId}:`, error);
      return null;
    }
  }

  // Get team statistics
  async getTeamStatistics(teamId, leagueId, season = new Date().getFullYear()) {
    try {
      const data = await this.makeRequest('teams/statistics', {
        team: teamId,
        league: leagueId,
        season: season
      });
      
      return this.normalizeTeamStatistics(data.response);
    } catch (error) {
      logger.error(`Error fetching team statistics ${teamId}:`, error);
      return null;
    }
  }

  // Normalize matches data
  normalizeMatches(matches) {
    return matches.map(match => {
      const fixture = match.fixture;
      const league = match.league;
      const teams = match.teams;
      const goals = match.goals;
      const score = match.score;

      return {
        id: fixture.id,
        leagueId: league.id,
        leagueName: league.name,
        season: league.season,
        status: this.mapMatchStatus(fixture.status.short),
        teams: {
          home: {
            id: teams.home.id,
            name: teams.home.name,
            logo: teams.home.logo,
            shortName: this.getTeamShortName(teams.home.name)
          },
          away: {
            id: teams.away.id,
            name: teams.away.name,
            logo: teams.away.logo,
            shortName: this.getTeamShortName(teams.away.name)
          }
        },
        scores: {
          home: {
            goals: goals.home || 0,
            halftime: score.halftime?.home || 0,
            fulltime: score.fulltime?.home || 0,
            extratime: score.extratime?.home || null,
            penalty: score.penalty?.home || null
          },
          away: {
            goals: goals.away || 0,
            halftime: score.halftime?.away || 0,
            fulltime: score.fulltime?.away || 0,
            extratime: score.extratime?.away || null,
            penalty: score.penalty?.away || null
          }
        },
        venue: {
          name: fixture.venue?.name,
          city: fixture.venue?.city
        },
        startsAt: new Date(fixture.date).getTime(),
        updatedAt: Date.now(),
        round: league.round,
        referee: fixture.referee,
        timezone: fixture.timezone,
        isAsianMatch: this.isAsianLeague(league.id),
        priority: this.isAsianLeague(league.id) ? 'high' : 'medium',
        source: 'api-football.com',
        elapsed: fixture.status.elapsed,
        country: league.country,
        flag: league.flag
      };
    });
  }

  // Normalize match detail with statistics and events
  normalizeMatchDetail(match, statistics, events) {
    const baseMatch = this.normalizeMatches([match])[0];
    
    return {
      ...baseMatch,
      statistics: this.normalizeMatchStatistics(statistics),
      events: this.normalizeMatchEvents(events),
      lineups: match.lineups ? this.normalizeLineups(match.lineups) : null
    };
  }

  // Normalize match statistics
  normalizeMatchStatistics(statistics) {
    if (!statistics || statistics.length === 0) return null;

    const homeStats = statistics[0]?.statistics || [];
    const awayStats = statistics[1]?.statistics || [];

    const getStatValue = (stats, type) => {
      const stat = stats.find(s => s.type === type);
      return stat ? stat.value : null;
    };

    return {
      home: {
        shotsOnGoal: getStatValue(homeStats, 'Shots on Goal'),
        shotsOffGoal: getStatValue(homeStats, 'Shots off Goal'),
        totalShots: getStatValue(homeStats, 'Total Shots'),
        blockedShots: getStatValue(homeStats, 'Blocked Shots'),
        shotsInsideBox: getStatValue(homeStats, 'Shots insidebox'),
        shotsOutsideBox: getStatValue(homeStats, 'Shots outsidebox'),
        fouls: getStatValue(homeStats, 'Fouls'),
        cornerKicks: getStatValue(homeStats, 'Corner Kicks'),
        offsides: getStatValue(homeStats, 'Offsides'),
        ballPossession: getStatValue(homeStats, 'Ball Possession'),
        yellowCards: getStatValue(homeStats, 'Yellow Cards'),
        redCards: getStatValue(homeStats, 'Red Cards'),
        goalkeeperSaves: getStatValue(homeStats, 'Goalkeeper Saves'),
        totalPasses: getStatValue(homeStats, 'Total passes'),
        passesAccurate: getStatValue(homeStats, 'Passes accurate'),
        passAccuracy: getStatValue(homeStats, 'Passes %')
      },
      away: {
        shotsOnGoal: getStatValue(awayStats, 'Shots on Goal'),
        shotsOffGoal: getStatValue(awayStats, 'Shots off Goal'),
        totalShots: getStatValue(awayStats, 'Total Shots'),
        blockedShots: getStatValue(awayStats, 'Blocked Shots'),
        shotsInsideBox: getStatValue(awayStats, 'Shots insidebox'),
        shotsOutsideBox: getStatValue(awayStats, 'Shots outsidebox'),
        fouls: getStatValue(awayStats, 'Fouls'),
        cornerKicks: getStatValue(awayStats, 'Corner Kicks'),
        offsides: getStatValue(awayStats, 'Offsides'),
        ballPossession: getStatValue(awayStats, 'Ball Possession'),
        yellowCards: getStatValue(awayStats, 'Yellow Cards'),
        redCards: getStatValue(awayStats, 'Red Cards'),
        goalkeeperSaves: getStatValue(awayStats, 'Goalkeeper Saves'),
        totalPasses: getStatValue(awayStats, 'Total passes'),
        passesAccurate: getStatValue(awayStats, 'Passes accurate'),
        passAccuracy: getStatValue(awayStats, 'Passes %')
      }
    };
  }

  // Normalize match events
  normalizeMatchEvents(events) {
    return events.map(event => ({
      time: {
        elapsed: event.time.elapsed,
        extra: event.time.extra
      },
      team: {
        id: event.team.id,
        name: event.team.name,
        logo: event.team.logo
      },
      player: {
        id: event.player?.id,
        name: event.player?.name
      },
      assist: {
        id: event.assist?.id,
        name: event.assist?.name
      },
      type: event.type,
      detail: event.detail,
      comments: event.comments
    }));
  }

  // Normalize lineups
  normalizeLineups(lineups) {
    return lineups.map(lineup => ({
      team: {
        id: lineup.team.id,
        name: lineup.team.name,
        logo: lineup.team.logo
      },
      coach: {
        id: lineup.coach?.id,
        name: lineup.coach?.name,
        photo: lineup.coach?.photo
      },
      formation: lineup.formation,
      startXI: lineup.startXI?.map(player => ({
        player: {
          id: player.player.id,
          name: player.player.name,
          number: player.player.number,
          pos: player.player.pos,
          photo: player.player.photo
        }
      })) || [],
      substitutes: lineup.substitutes?.map(player => ({
        player: {
          id: player.player.id,
          name: player.player.name,
          number: player.player.number,
          pos: player.player.pos,
          photo: player.player.photo
        }
      })) || []
    }));
  }

  // Normalize standings
  normalizeStandings(standings) {
    if (!standings || standings.length === 0) return [];

    const league = standings[0];
    return league.league.standings[0]?.map(team => ({
      position: team.rank,
      team: {
        id: team.team.id,
        name: team.team.name,
        logo: team.team.logo
      },
      points: team.points,
      goalsDiff: team.goalsDiff,
      group: team.group,
      form: team.form,
      status: team.status,
      description: team.description,
      all: {
        played: team.all.played,
        win: team.all.win,
        draw: team.all.draw,
        lose: team.all.lose,
        goals: {
          for: team.all.goals.for,
          against: team.all.goals.against
        }
      },
      home: {
        played: team.home.played,
        win: team.home.win,
        draw: team.home.draw,
        lose: team.home.lose,
        goals: {
          for: team.home.goals.for,
          against: team.home.goals.against
        }
      },
      away: {
        played: team.away.played,
        win: team.away.win,
        draw: team.away.draw,
        lose: team.away.lose,
        goals: {
          for: team.away.goals.for,
          against: team.away.goals.against
        }
      },
      update: team.update
    })) || [];
  }

  // Normalize top scorers
  normalizeTopScorers(players) {
    return players.map(playerData => ({
      player: {
        id: playerData.player.id,
        name: playerData.player.name,
        firstname: playerData.player.firstname,
        lastname: playerData.player.lastname,
        age: playerData.player.age,
        birth: playerData.player.birth,
        nationality: playerData.player.nationality,
        height: playerData.player.height,
        weight: playerData.player.weight,
        injured: playerData.player.injured,
        photo: playerData.player.photo
      },
      statistics: playerData.statistics.map(stat => ({
        team: {
          id: stat.team.id,
          name: stat.team.name,
          logo: stat.team.logo
        },
        league: {
          id: stat.league.id,
          name: stat.league.name,
          country: stat.league.country,
          logo: stat.league.logo,
          flag: stat.league.flag,
          season: stat.league.season
        },
        games: stat.games,
        substitutes: stat.substitutes,
        shots: stat.shots,
        goals: stat.goals,
        passes: stat.passes,
        tackles: stat.tackles,
        duels: stat.duels,
        dribbles: stat.dribbles,
        fouls: stat.fouls,
        cards: stat.cards,
        penalty: stat.penalty
      }))
    }));
  }

  // Normalize team info
  normalizeTeamInfo(team) {
    return {
      id: team.team.id,
      name: team.team.name,
      code: team.team.code,
      country: team.team.country,
      founded: team.team.founded,
      national: team.team.national,
      logo: team.team.logo,
      venue: {
        id: team.venue?.id,
        name: team.venue?.name,
        address: team.venue?.address,
        city: team.venue?.city,
        capacity: team.venue?.capacity,
        surface: team.venue?.surface,
        image: team.venue?.image
      }
    };
  }

  // Normalize team statistics
  normalizeTeamStatistics(stats) {
    if (!stats) return null;

    return {
      league: {
        id: stats.league.id,
        name: stats.league.name,
        country: stats.league.country,
        logo: stats.league.logo,
        flag: stats.league.flag,
        season: stats.league.season
      },
      team: {
        id: stats.team.id,
        name: stats.team.name,
        logo: stats.team.logo
      },
      form: stats.form,
      fixtures: stats.fixtures,
      goals: stats.goals,
      biggest: stats.biggest,
      clean_sheet: stats.clean_sheet,
      failed_to_score: stats.failed_to_score,
      penalty: stats.penalty,
      lineups: stats.lineups,
      cards: stats.cards
    };
  }

  // Helper methods
  isAsianLeague(leagueId) {
    return Object.prototype.hasOwnProperty.call(this.asianLeagues, leagueId);
  }

  getTeamShortName(teamName) {
    // Common Asian team short names
    const shortNames = {
      'Mumbai City': 'MCFC',
      'Bengaluru': 'BFC',
      'ATK Mohun Bagan': 'ATKMB',
      'FC Goa': 'FCG',
      'Hyderabad': 'HFC',
      'Jamshedpur': 'JFC',
      'Kerala Blasters': 'KBFC',
      'NorthEast United': 'NEUFC',
      'Odisha': 'OFC',
      'Punjab': 'PBFC',
      'Chennaiyin': 'CFC'
    };
    
    return shortNames[teamName] || teamName?.substring(0, 3)?.toUpperCase() || 'TBD';
  }

  mapMatchStatus(apiStatus) {
    const statusMap = {
      'TBD': 'upcoming',
      'NS': 'upcoming',
      '1H': 'live',
      'HT': 'live',
      '2H': 'live',
      'ET': 'live',
      'BT': 'live',
      'P': 'live',
      'SUSP': 'suspended',
      'INT': 'interrupted',
      'FT': 'completed',
      'AET': 'completed',
      'PEN': 'completed',
      'PST': 'postponed',
      'CANC': 'cancelled',
      'ABD': 'abandoned',
      'AWD': 'awarded',
      'WO': 'walkover'
    };
    return statusMap[apiStatus] || 'upcoming';
  }
}

module.exports = FootballApiService;
