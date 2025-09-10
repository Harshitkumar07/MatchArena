/**
 * Base adapter interface for sports data providers
 * All sport-specific adapters must implement these methods
 */

export class BaseSportAdapter {
  constructor(sport) {
    this.sport = sport;
  }

  /**
   * Get live matches for the sport
   * @returns {Promise<Array>} Array of normalized match objects
   */
  async getLiveMatches() {
    throw new Error('getLiveMatches must be implemented by subclass');
  }

  /**
   * Get upcoming matches for the sport
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Array>} Array of normalized match objects
   */
  async getUpcomingMatches(days = 7) {
    throw new Error('getUpcomingMatches must be implemented by subclass');
  }

  /**
   * Get completed/recent matches for the sport
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} Array of normalized match objects
   */
  async getRecentMatches(days = 7) {
    throw new Error('getRecentMatches must be implemented by subclass');
  }

  /**
   * Get detailed match information
   * @param {string} matchId - Match identifier
   * @returns {Promise<Object>} Normalized match detail object
   */
  async getMatchDetail(matchId) {
    throw new Error('getMatchDetail must be implemented by subclass');
  }

  /**
   * Get series/tournament list for the sport
   * @returns {Promise<Array>} Array of normalized series objects
   */
  async getSeries() {
    throw new Error('getSeries must be implemented by subclass');
  }

  /**
   * Get series/tournament details
   * @param {string} seriesId - Series identifier
   * @returns {Promise<Object>} Normalized series detail object
   */
  async getSeriesDetail(seriesId) {
    throw new Error('getSeriesDetail must be implemented by subclass');
  }

  /**
   * Get team information
   * @param {string} teamId - Team identifier
   * @returns {Promise<Object>} Team information object
   */
  async getTeamInfo(teamId) {
    throw new Error('getTeamInfo must be implemented by subclass');
  }

  /**
   * Get player information
   * @param {string} playerId - Player identifier
   * @returns {Promise<Object>} Player information object
   */
  async getPlayerInfo(playerId) {
    throw new Error('getPlayerInfo must be implemented by subclass');
  }

  /**
   * Search matches by team or tournament
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching results
   */
  async searchMatches(query) {
    throw new Error('searchMatches must be implemented by subclass');
  }

  /**
   * Normalize match data to common format
   * @param {Object} rawMatch - Raw match data from provider
   * @returns {Object} Normalized match object
   */
  normalizeMatch(rawMatch) {
    throw new Error('normalizeMatch must be implemented by subclass');
  }

  /**
   * Normalize series data to common format
   * @param {Object} rawSeries - Raw series data from provider
   * @returns {Object} Normalized series object
   */
  normalizeSeries(rawSeries) {
    throw new Error('normalizeSeries must be implemented by subclass');
  }

  /**
   * Common match object structure:
   * {
   *   id: string,
   *   sport: string,
   *   seriesId: string,
   *   seriesName: string,
   *   status: 'live' | 'upcoming' | 'completed',
   *   teams: {
   *     home: { id: string, name: string, shortName: string, logo: string },
   *     away: { id: string, name: string, shortName: string, logo: string }
   *   },
   *   scores: {
   *     home: { ... sport-specific score data },
   *     away: { ... sport-specific score data }
   *   },
   *   venue: string,
   *   startsAt: timestamp,
   *   updatedAt: timestamp,
   *   matchType: string,
   *   timeline: { ... sport-specific timeline data },
   *   result: string,
   *   winnerTeamId: string | null,
   *   metadata: { ... additional sport-specific data }
   * }
   */

  /**
   * Common series object structure:
   * {
   *   id: string,
   *   sport: string,
   *   name: string,
   *   season: string,
   *   startDate: timestamp,
   *   endDate: timestamp,
   *   teams: Array<TeamInfo>,
   *   matches: Array<string>, // match IDs
   *   standings: Array<StandingInfo>,
   *   status: 'upcoming' | 'ongoing' | 'completed',
   *   metadata: { ... additional sport-specific data }
   * }
   */
}

/**
 * Match status constants
 */
export const MATCH_STATUS = {
  LIVE: 'live',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
  ABANDONED: 'abandoned'
};

/**
 * Sport type constants
 */
export const SPORT_TYPE = {
  CRICKET: 'cricket',
  FOOTBALL: 'football',
  KABADDI: 'kabaddi',
  BASKETBALL: 'basketball',
  TENNIS: 'tennis',
  HOCKEY: 'hockey'
};

/**
 * Common error class for API adapters
 */
export class AdapterError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AdapterError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Error codes for adapter errors
 */
export const ERROR_CODES = {
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED'
};
