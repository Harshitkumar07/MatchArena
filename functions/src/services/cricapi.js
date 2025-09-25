const { getConfig } = require('../config');
const { createHttpClient, get } = require('../utils/http');
const { generateCacheKey, getCachedOrFetch } = require('../utils/cache');
const functions = require('firebase-functions');

class CricAPIService {
  constructor() {
    const config = getConfig();
    this.apiKey = config.cricapi.key;
    this.baseUrl = config.cricapi.baseUrl;
    this.client = createHttpClient(this.baseUrl);
  }

  /**
   * Get live cricket matches
   */
  async getLiveMatches() {
    const cacheKey = generateCacheKey('cricket/live');
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const data = await get(this.client, '/currentMatches', {
            apikey: this.apiKey,
            offset: 0
          });
          
          // Filter and normalize matches
          const matches = Array.isArray(data) ? data : data.data || [];
          return matches.filter(match => match.matchStarted || match.status === 'Live');
        } catch (error) {
          functions.logger.error('CricAPI getLiveMatches error:', error);
          throw error;
        }
      },
      'live'
    );
  }

  /**
   * Get upcoming cricket matches
   */
  async getUpcomingMatches() {
    const cacheKey = generateCacheKey('cricket/upcoming');
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const data = await get(this.client, '/matches', {
            apikey: this.apiKey,
            offset: 0
          });
          
          // Filter for upcoming matches
          const matches = Array.isArray(data) ? data : data.data || [];
          const now = Date.now();
          
          return matches.filter(match => {
            if (match.matchEnded) return false;
            if (match.matchStarted) return false;
            if (!match.dateTimeGMT) return false;
            
            const matchTime = new Date(match.dateTimeGMT).getTime();
            return matchTime > now;
          }).slice(0, 20); // Limit to 20 upcoming matches
        } catch (error) {
          functions.logger.error('CricAPI getUpcomingMatches error:', error);
          throw error;
        }
      },
      'upcoming'
    );
  }

  /**
   * Get recent/completed cricket matches
   */
  async getRecentMatches() {
    const cacheKey = generateCacheKey('cricket/recent');
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const data = await get(this.client, '/matches', {
            apikey: this.apiKey,
            offset: 0
          });
          
          // Filter for completed matches
          const matches = Array.isArray(data) ? data : data.data || [];
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          
          return matches.filter(match => {
            if (!match.matchEnded) return false;
            if (!match.dateTimeGMT) return false;
            
            const matchTime = new Date(match.dateTimeGMT).getTime();
            return matchTime > sevenDaysAgo;
          }).slice(0, 20); // Limit to 20 recent matches
        } catch (error) {
          functions.logger.error('CricAPI getRecentMatches error:', error);
          throw error;
        }
      },
      'recent'
    );
  }

  /**
   * Get cricket series/tournaments
   */
  async getSeries() {
    const cacheKey = generateCacheKey('cricket/series');
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const data = await get(this.client, '/series', {
            apikey: this.apiKey,
            offset: 0
          });
          
          const series = Array.isArray(data) ? data : data.data || [];
          // Return active series
          return series.filter(s => !s.matches || s.matches > 0).slice(0, 20);
        } catch (error) {
          functions.logger.error('CricAPI getSeries error:', error);
          // Return empty array on error (series is optional)
          return [];
        }
      },
      'leagues'
    );
  }

  /**
   * Get match details
   */
  async getMatchDetails(matchId) {
    const cacheKey = generateCacheKey(`cricket/match/${matchId}`);
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const data = await get(this.client, '/match_info', {
            apikey: this.apiKey,
            id: matchId
          });
          
          return data;
        } catch (error) {
          functions.logger.error('CricAPI getMatchDetails error:', error);
          throw error;
        }
      },
      'live' // Use short cache for match details
    );
  }

  /**
   * Get match scorecard
   */
  async getMatchScorecard(matchId) {
    const cacheKey = generateCacheKey(`cricket/scorecard/${matchId}`);
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const data = await get(this.client, '/match_scorecard', {
            apikey: this.apiKey,
            id: matchId
          });
          
          return data;
        } catch (error) {
          functions.logger.error('CricAPI getMatchScorecard error:', error);
          // Scorecard might not be available for all matches
          return null;
        }
      },
      'live'
    );
  }
}

// Export singleton instance
module.exports = new CricAPIService();