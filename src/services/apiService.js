/**
 * Frontend API Service for MatchArena
 * Now uses Firebase Functions for secure, real-time sports data
 */

class APIService {
  constructor() {
    // Static API files on Firebase Hosting (no functions needed)
    this.functionsBase = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api'
      : 'https://matcharena-app-e3d24.web.app/api';
    
    // Request cache to improve performance
    this.cache = new Map();
    this.cacheExpiry = 2 * 60 * 1000; // 2 minutes for live data
    this.standardCacheExpiry = 10 * 60 * 1000; // 10 minutes for static data
    
    // Clear any existing cache on initialization
    this.clearCache();
    console.log('🔥 APIService initialized with Firebase Functions backend');
  }
  
  // Clear all cached data
  clearCache() {
    this.cache.clear();
    console.log('🗑️ API cache cleared');
  }

  // Generic request method with caching for Firebase Functions
  async makeRequest(endpoint, options = {}) {
    const url = `${this.functionsBase}${endpoint}`;
    const cacheKey = endpoint + JSON.stringify(options);
    const cached = this.cache.get(cacheKey);
    
    // Determine cache expiry based on endpoint
    const isLive = endpoint.includes('/live') || endpoint.includes('matches/live');
    const expiry = isLive ? this.cacheExpiry : this.standardCacheExpiry;
    
    if (cached && Date.now() - cached.timestamp < expiry) {
      console.log('Cache hit for:', endpoint);
      return cached.data;
    }

    try {
      console.log('Making Firebase Function request to:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`Firebase Function error! status: ${response.status} for ${endpoint}`);
      }

      const result = await response.json();
      
      // Check if the Firebase Function returned success
      if (!result.success) {
        throw new Error(result.error || `API request failed for ${endpoint}`);
      }
      
      // Cache the response data
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });

      return result.data;
    } catch (error) {
      console.error('Firebase Function request failed:', endpoint, error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log('Using expired cache due to error for:', endpoint);
        return cached.data;
      }
      
      // Return empty array/object as fallback
      return Array.isArray(options.fallback) ? [] : options.fallback || {};
    }
  }

  // ============ CRICKET API METHODS ============
  
  // Get cricket matches by type (live, upcoming, recent)
  async getCricketMatches(type = 'live') {
    try {
      console.log(`🏏 Fetching ${type} cricket matches...`);
      return await this.makeRequest(`/cricket/matches/${type}.json`, { fallback: [] });
    } catch (error) {
      console.error(`Error fetching ${type} cricket matches:`, error);
      return [];
    }
  }

  // Get cricket match details
  async getCricketMatchDetail(matchId) {
    try {
      console.log(`🏏 Fetching cricket match detail for ${matchId}...`);
      return await this.makeRequest(`/cricket/match/${matchId}`);
    } catch (error) {
      console.error('Error fetching cricket match detail:', error);
      return null;
    }
  }

  // Get cricket series
  async getCricketSeries() {
    try {
      console.log('🏏 Fetching cricket series...');
      return await this.makeRequest('/cricket/series', { fallback: [] });
    } catch (error) {
      console.error('Error fetching cricket series:', error);
      return [];
    }
  }

  // ============ MULTI-SPORT API METHODS ============
  
  // Get all supported sports
  async getSupportedSports() {
    try {
      console.log('🌐 Fetching supported sports list...');
      return await this.makeRequest('/sports/list', { fallback: [] });
    } catch (error) {
      console.error('Error fetching supported sports:', error);
      return this.getFallbackSportsList();
    }
  }

  // Get fixtures for any sport
  async getSportFixtures(sport, status = null, league = null, season = null) {
    try {
      let endpoint = `/sports/${sport}/fixtures`;
      const params = new URLSearchParams();
      
      if (status) params.append('status', status);
      if (league) params.append('league', league);  
      if (season) params.append('season', season);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      console.log(`🏈 Fetching ${sport} fixtures...`);
      return await this.makeRequest(endpoint, { fallback: [] });
    } catch (error) {
      console.error(`Error fetching ${sport} fixtures:`, error);
      return [];
    }
  }

  // Get leagues for any sport
  async getSportLeagues(sport) {
    try {
      console.log(`🏆 Fetching ${sport} leagues...`);
      return await this.makeRequest(`/sports/${sport}/leagues`, { fallback: [] });
    } catch (error) {
      console.error(`Error fetching ${sport} leagues:`, error);
      return [];
    }
  }

  // Get all live matches from all sports
  async getAllLiveMatches() {
    try {
      console.log('🔴 Fetching all live matches...');
      return await this.makeRequest('/matches/live', { fallback: [] });
    } catch (error) {
      console.error('Error fetching all live matches:', error);
      return [];
    }
  }

  // Get all upcoming matches from all sports  
  async getAllUpcomingMatches(days = 7) {
    try {
      console.log(`📅 Fetching upcoming matches for ${days} days...`);
      return await this.makeRequest(`/matches/upcoming?days=${days}`, { fallback: [] });
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      return [];
    }
  }

  // ============ DASHBOARD API METHODS ============
  
  // Get comprehensive dashboard data
  async getDashboardData() {
    try {
      console.log('📊 Fetching dashboard data...');
      
      const [cricketLive, cricketUpcoming, cricketSeries, allLive, allUpcoming, sports] = await Promise.all([
        this.getCricketMatches('live'),
        this.getCricketMatches('upcoming'), 
        this.getCricketSeries(),
        this.getAllLiveMatches(),
        this.getAllUpcomingMatches(7),
        this.getSupportedSports()
      ]);
      
      return {
        cricket: {
          live: cricketLive,
          upcoming: cricketUpcoming,
          series: cricketSeries
        },
        allSports: {
          live: allLive,
          upcoming: allUpcoming,
          supported: sports
        },
        summary: {
          totalLive: allLive.length,
          totalUpcoming: allUpcoming.length,
          cricketLive: cricketLive.length,
          totalSports: sports.length
        },
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        cricket: { live: [], upcoming: [], series: [] },
        allSports: { live: [], upcoming: [], supported: [] },
        summary: { totalLive: 0, totalUpcoming: 0, cricketLive: 0, totalSports: 0 },
        lastUpdated: Date.now(),
        error: error.message
      };
    }
  }

  // ============ UTILITY METHODS ============
  
  // API health check
  async checkAPIHealth() {
    try {
      console.log('🩺 Checking API health...');
      return await this.makeRequest('/health');
    } catch (error) {
      console.error('API health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Get API status and configuration
  async getAPIStatus() {
    try {
      console.log('📊 Fetching API status...');
      return await this.makeRequest('/api/status');
    } catch (error) {
      console.error('Error fetching API status:', error);
      return { configured: false, error: error.message };
    }
  }

  // Fallback sports list if API fails
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

  // Group matches by sport
  groupMatchesBySport(matches) {
    return matches.reduce((grouped, match) => {
      const sport = match.sport || 'unknown';
      if (!grouped[sport]) {
        grouped[sport] = [];
      }
      grouped[sport].push(match);
      return grouped;
    }, {});
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;
