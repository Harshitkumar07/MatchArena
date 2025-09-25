/**
 * Unified Sports API Service
 * Combines Cricket and Multi-Sport APIs with real backend integration
 */

// API base URL - uses Firebase Functions rewrite
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001/matcharena-app-e3d24/us-central1/api'
  : '/api';

class SportsService {
  constructor() {
    this.baseUrl = API_BASE;
    this.cache = new Map();
    this.cacheTimeout = {
      live: 15 * 1000,      // 15 seconds for live data
      upcoming: 2 * 60 * 1000,   // 2 minutes for upcoming
      recent: 5 * 60 * 1000,     // 5 minutes for recent
      leagues: 60 * 60 * 1000    // 1 hour for leagues
    };
  }

  /**
   * Generic fetch with caching
   */
  async fetchWithCache(endpoint, cacheType = 'upcoming', options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const timeout = this.cacheTimeout[cacheType] || this.cacheTimeout.upcoming;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < timeout) {
        return cached.data;
      }
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`🌐 Fetching from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'API request failed');
      }

      // Cache the successful response
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
        metadata: {
          count: result.count,
          lastUpdated: result.lastUpdated
        }
      });

      return result.data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      
      // Return stale cache if available
      if (this.cache.has(cacheKey)) {
        console.warn(`⚠️  Using stale cache for ${endpoint}`);
        return this.cache.get(cacheKey).data;
      }
      
      throw error;
    }
  }

  // ==================== CRICKET API METHODS ====================

  /**
   * Get live cricket matches
   */
  async getCricketLive() {
    try {
      return await this.fetchWithCache('/cricket/live', 'live');
    } catch (error) {
      console.error('Failed to fetch live cricket matches:', error);
      return [];
    }
  }

  /**
   * Get upcoming cricket matches
   */
  async getCricketUpcoming() {
    try {
      return await this.fetchWithCache('/cricket/upcoming', 'upcoming');
    } catch (error) {
      console.error('Failed to fetch upcoming cricket matches:', error);
      return [];
    }
  }

  /**
   * Get recent cricket matches
   */
  async getCricketRecent() {
    try {
      return await this.fetchWithCache('/cricket/recent', 'recent');
    } catch (error) {
      console.error('Failed to fetch recent cricket matches:', error);
      return [];
    }
  }

  /**
   * Get cricket series
   */
  async getCricketSeries() {
    try {
      return await this.fetchWithCache('/cricket/series', 'leagues');
    } catch (error) {
      console.error('Failed to fetch cricket series:', error);
      return [];
    }
  }

  /**
   * Get cricket match details
   */
  async getCricketMatch(matchId) {
    try {
      return await this.fetchWithCache(`/cricket/match/${matchId}`, 'live');
    } catch (error) {
      console.error(`Failed to fetch cricket match ${matchId}:`, error);
      throw error;
    }
  }

  // ==================== MULTI-SPORT API METHODS ====================

  /**
   * Get supported sports list
   */
  async getSportsList() {
    try {
      return await this.fetchWithCache('/sports/list', 'leagues');
    } catch (error) {
      console.error('Failed to fetch sports list:', error);
      return this.getFallbackSportsList();
    }
  }

  /**
   * Get live matches for specific sport
   */
  async getSportLive(sport) {
    try {
      return await this.fetchWithCache(`/sports/${sport}/live`, 'live');
    } catch (error) {
      console.error(`Failed to fetch live ${sport} matches:`, error);
      return [];
    }
  }

  /**
   * Get upcoming matches for specific sport
   */
  async getSportUpcoming(sport, days = 7) {
    try {
      const endpoint = `/sports/${sport}/upcoming${days !== 7 ? `?days=${days}` : ''}`;
      return await this.fetchWithCache(endpoint, 'upcoming');
    } catch (error) {
      console.error(`Failed to fetch upcoming ${sport} matches:`, error);
      return [];
    }
  }

  /**
   * Get recent matches for specific sport
   */
  async getSportRecent(sport, days = 7) {
    try {
      const endpoint = `/sports/${sport}/recent${days !== 7 ? `?days=${days}` : ''}`;
      return await this.fetchWithCache(endpoint, 'recent');
    } catch (error) {
      console.error(`Failed to fetch recent ${sport} matches:`, error);
      return [];
    }
  }

  /**
   * Get leagues for specific sport
   */
  async getSportLeagues(sport, country = null) {
    try {
      const endpoint = `/sports/${sport}/leagues${country ? `?country=${country}` : ''}`;
      return await this.fetchWithCache(endpoint, 'leagues');
    } catch (error) {
      console.error(`Failed to fetch ${sport} leagues:`, error);
      return [];
    }
  }

  // ==================== COMBINED DATA METHODS ====================

  /**
   * Get all live matches (cricket + sports)
   */
  async getAllLiveMatches() {
    try {
      return await this.fetchWithCache('/matches/live', 'live');
    } catch (error) {
      console.error('Failed to fetch all live matches:', error);
      
      // Fallback: try to get cricket and popular sports separately
      try {
        const [cricket, popular] = await Promise.all([
          this.getCricketLive().catch(() => []),
          this.getPopularSportsLive().catch(() => [])
        ]);
        
        return [...cricket, ...popular];
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Get live matches from popular sports only
   */
  async getPopularSportsLive() {
    try {
      return await this.fetchWithCache('/sports/popular?status=live', 'live');
    } catch (error) {
      console.error('Failed to fetch popular sports live matches:', error);
      return [];
    }
  }

  /**
   * Get upcoming matches from popular sports
   */
  async getPopularSportsUpcoming() {
    try {
      return await this.fetchWithCache('/sports/popular?status=upcoming', 'upcoming');
    } catch (error) {
      console.error('Failed to fetch popular sports upcoming matches:', error);
      return [];
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData() {
    try {
      const [
        cricketLive,
        cricketUpcoming,
        sportsLive,
        sportsUpcoming,
        sportsList
      ] = await Promise.allSettled([
        this.getCricketLive(),
        this.getCricketUpcoming(),
        this.getPopularSportsLive(),
        this.getPopularSportsUpcoming(),
        this.getSportsList()
      ]);

      return {
        cricket: {
          live: cricketLive.status === 'fulfilled' ? cricketLive.value : [],
          upcoming: cricketUpcoming.status === 'fulfilled' ? cricketUpcoming.value : []
        },
        sports: {
          live: sportsLive.status === 'fulfilled' ? sportsLive.value : [],
          upcoming: sportsUpcoming.status === 'fulfilled' ? sportsUpcoming.value : [],
          list: sportsList.status === 'fulfilled' ? sportsList.value : this.getFallbackSportsList()
        },
        combined: {
          totalLive: (cricketLive.value || []).length + (sportsLive.value || []).length,
          totalUpcoming: (cricketUpcoming.value || []).length + (sportsUpcoming.value || []).length
        },
        lastUpdated: Date.now(),
        cacheStatus: {
          cricket: cricketLive.status,
          sports: sportsLive.status
        }
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      return {
        cricket: { live: [], upcoming: [] },
        sports: { live: [], upcoming: [], list: this.getFallbackSportsList() },
        combined: { totalLive: 0, totalUpcoming: 0 },
        lastUpdated: Date.now(),
        error: error.message
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get fallback sports list if API fails
   */
  getFallbackSportsList() {
    return [
      { id: 'football', name: 'Football', icon: '⚽', endpoint: 'football' },
      { id: 'basketball', name: 'Basketball', icon: '🏀', endpoint: 'basketball' },
      { id: 'tennis', name: 'Tennis', icon: '🎾', endpoint: 'tennis' },
      { id: 'hockey', name: 'Hockey', icon: '🏒', endpoint: 'hockey' },
      { id: 'volleyball', name: 'Volleyball', icon: '🏐', endpoint: 'volleyball' },
      { id: 'handball', name: 'Handball', icon: '🤾', endpoint: 'handball' },
      { id: 'rugby', name: 'Rugby', icon: '🏉', endpoint: 'rugby' },
      { id: 'baseball', name: 'Baseball', icon: '⚾', endpoint: 'baseball' }
    ];
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cache
   */
  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      console.log('🗑️ All cache cleared');
      return;
    }
    
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        console.log(`🗑️ Cache cleared for: ${key}`);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timestamps: Array.from(this.cache.values()).map(v => ({
        timestamp: v.timestamp,
        age: Date.now() - v.timestamp
      }))
    };
  }
}

// Export singleton instance
export const sportsService = new SportsService();

// Export individual functions for backward compatibility
export const getCricketLive = () => sportsService.getCricketLive();
export const getCricketUpcoming = () => sportsService.getCricketUpcoming();
export const getCricketRecent = () => sportsService.getCricketRecent();
export const getCricketSeries = () => sportsService.getCricketSeries();
export const getAllLiveMatches = () => sportsService.getAllLiveMatches();
export const getSportsList = () => sportsService.getSportsList();
export const getDashboardData = () => sportsService.getDashboardData();

export default sportsService;
