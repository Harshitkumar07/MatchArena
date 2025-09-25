const { getConfig } = require('../config');
const { createHttpClient, get } = require('../utils/http');
const { generateCacheKey, getCachedOrFetch } = require('../utils/cache');
const functions = require('firebase-functions');

class APISportsService {
  constructor() {
    const config = getConfig();
    this.apiKey = config.apisports.key;
    this.hosts = config.apisports.hosts;
    this.clients = {};
  }

  /**
   * Get HTTP client for specific sport
   */
  getClient(sport) {
    if (!this.clients[sport]) {
      const host = this.hosts[sport];
      if (!host) {
        throw new Error(`Sport ${sport} not supported`);
      }
      
      this.clients[sport] = createHttpClient(host, {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': host.replace('https://', '')
      });
    }
    
    return this.clients[sport];
  }

  /**
   * Get resource name for sport (fixtures vs games)
   */
  getResourceName(sport) {
    if (sport === 'football') return 'fixtures';
    return 'games';
  }

  /**
   * Get live matches for any sport
   */
  async getLiveMatches(sport) {
    const cacheKey = generateCacheKey(`${sport}/live`);
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const client = this.getClient(sport);
          const resource = this.getResourceName(sport);
          
          const data = await get(client, `/${resource}`, {
            live: 'all'
          });
          
          return Array.isArray(data) ? data : [];
        } catch (error) {
          functions.logger.error(`API-Sports getLiveMatches error for ${sport}:`, error);
          return [];
        }
      },
      'live'
    );
  }

  /**
   * Get upcoming matches for any sport
   */
  async getUpcomingMatches(sport, days = 7) {
    const cacheKey = generateCacheKey(`${sport}/upcoming`, { days });
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const client = this.getClient(sport);
          const resource = this.getResourceName(sport);
          
          let params = {};
          
          // Use next parameter for football to get upcoming matches efficiently
          if (sport === 'football') {
            params.next = 50;
          } else {
            // For other sports, use date range
            const today = new Date();
            const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
            params.from = today.toISOString().split('T')[0];
            params.to = futureDate.toISOString().split('T')[0];
          }
          
          const data = await get(client, `/${resource}`, params);
          
          const matches = Array.isArray(data) ? data : [];
          
          // Filter for truly upcoming matches
          const now = Date.now();
          return matches.filter(match => {
            const matchTime = new Date(match.fixture?.date || match.date).getTime();
            return matchTime > now;
          }).slice(0, 30);
        } catch (error) {
          functions.logger.error(`API-Sports getUpcomingMatches error for ${sport}:`, error);
          return [];
        }
      },
      'upcoming'
    );
  }

  /**
   * Get recent/completed matches for any sport
   */
  async getRecentMatches(sport, days = 7) {
    const cacheKey = generateCacheKey(`${sport}/recent`, { days });
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const client = this.getClient(sport);
          const resource = this.getResourceName(sport);
          
          const today = new Date();
          const pastDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
          
          let params = {
            from: pastDate.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0]
          };
          
          // Add status filter if supported
          if (sport === 'football') {
            params.status = 'FT';
          }
          
          const data = await get(client, `/${resource}`, params);
          
          const matches = Array.isArray(data) ? data : [];
          return matches.filter(match => {
            // Filter for completed matches
            const status = match.fixture?.status?.short || match.status?.short;
            return ['FT', 'AET', 'PEN', 'CANC'].includes(status);
          }).slice(0, 30);
        } catch (error) {
          functions.logger.error(`API-Sports getRecentMatches error for ${sport}:`, error);
          return [];
        }
      },
      'recent'
    );
  }

  /**
   * Get leagues for any sport
   */
  async getLeagues(sport, country = null) {
    const cacheKey = generateCacheKey(`${sport}/leagues`, { country });
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const client = this.getClient(sport);
          
          let params = {};
          if (country) {
            params.country = country;
          }
          
          const data = await get(client, '/leagues', params);
          
          return Array.isArray(data) ? data : [];
        } catch (error) {
          functions.logger.error(`API-Sports getLeagues error for ${sport}:`, error);
          return [];
        }
      },
      'leagues'
    );
  }

  /**
   * Get standings for any sport
   */
  async getStandings(sport, league, season) {
    const cacheKey = generateCacheKey(`${sport}/standings`, { league, season });
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const client = this.getClient(sport);
          
          const data = await get(client, '/standings', {
            league,
            season
          });
          
          return Array.isArray(data) ? data : [];
        } catch (error) {
          functions.logger.error(`API-Sports getStandings error for ${sport}:`, error);
          return [];
        }
      },
      'standings'
    );
  }

  /**
   * Get teams for any sport
   */
  async getTeams(sport, league = null, season = null, search = null) {
    const cacheKey = generateCacheKey(`${sport}/teams`, { league, season, search });
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const client = this.getClient(sport);
          
          let params = {};
          if (league) params.league = league;
          if (season) params.season = season;
          if (search) params.search = search;
          
          const data = await get(client, '/teams', params);
          
          return Array.isArray(data) ? data : [];
        } catch (error) {
          functions.logger.error(`API-Sports getTeams error for ${sport}:`, error);
          return [];
        }
      },
      'leagues'
    );
  }

  /**
   * Get all live matches from multiple sports
   */
  async getAllLiveMatches() {
    const cacheKey = generateCacheKey('multi-sport/all-live');
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        try {
          const sports = ['football', 'basketball', 'tennis', 'hockey'];
          const promises = sports.map(sport => 
            this.getLiveMatches(sport).catch(error => {
              functions.logger.warn(`Failed to get live matches for ${sport}:`, error);
              return [];
            })
          );
          
          const results = await Promise.all(promises);
          
          // Combine and add sport identifier
          const allMatches = [];
          results.forEach((matches, index) => {
            const sport = sports[index];
            matches.forEach(match => {
              allMatches.push({ ...match, sport });
            });
          });
          
          return allMatches;
        } catch (error) {
          functions.logger.error('API-Sports getAllLiveMatches error:', error);
          return [];
        }
      },
      'live'
    );
  }

  /**
   * Get supported sports list
   */
  getSupportedSports() {
    return Object.keys(this.hosts).map(sport => ({
      id: sport,
      name: sport.charAt(0).toUpperCase() + sport.slice(1).replace('-', ' '),
      endpoint: sport,
      icon: this.getSportIcon(sport)
    }));
  }

  /**
   * Get sport icon
   */
  getSportIcon(sport) {
    const icons = {
      football: '⚽',
      basketball: '🏀',
      baseball: '⚾',
      hockey: '🏒',
      tennis: '🎾',
      volleyball: '🏐',
      handball: '🤾',
      rugby: '🏉',
      'american-football': '🏈'
    };
    return icons[sport] || '🏆';
  }
}

// Export singleton instance
module.exports = new APISportsService();
