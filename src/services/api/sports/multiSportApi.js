/**
 * Multi-Sport API Service
 * Uses Firebase Functions to call API-Football for 20+ sports
 */

import { BaseSportAdapter, MATCH_STATUS, AdapterError, ERROR_CODES } from '../adapters/base';

// Firebase Functions endpoint
const FUNCTIONS_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001/matcharena-app-e3d24/us-central1/sportsApi'
  : 'https://us-central1-matcharena-app-e3d24.cloudfunctions.net/sportsApi';

class MultiSportAPIService extends BaseSportAdapter {
  constructor() {
    super('multi-sport');
    this.functionsBase = FUNCTIONS_BASE;
    this.cache = new Map();
    this.cacheTimeout = 120000; // 2 minutes cache for multi-sport
    this.liveCacheTimeout = 30000; // 30 seconds for live matches
  }

  async fetchFromFunction(endpoint, cacheKey, isLive = false, options = {}) {
    const timeout = isLive ? this.liveCacheTimeout : this.cacheTimeout;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < timeout) {
        return cached.data;
      }
    }

    try {
      const url = `${this.functionsBase}${endpoint}`;
      console.log('Fetching multi-sport data from Firebase Function:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new AdapterError(
          `Multi-sport API request failed: ${response.statusText}`,
          ERROR_CODES.API_ERROR,
          { status: response.status, url }
        );
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new AdapterError(
          result.error || 'Multi-sport API request failed',
          ERROR_CODES.API_ERROR,
          result
        );
      }
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });

      return result.data;
    } catch (error) {
      console.error('Multi-sport Firebase Function Error:', error);
      
      // Return stale cache if available
      if (this.cache.has(cacheKey)) {
        console.warn('Using stale cache due to error:', error.message);
        return this.cache.get(cacheKey).data;
      }
      
      throw new AdapterError(
        'Failed to fetch multi-sport data from server',
        ERROR_CODES.NETWORK_ERROR,
        { originalError: error.message }
      );
    }
  }

  // Get all supported sports from API-Football
  async getSupportedSports() {
    try {
      return await this.fetchFromFunction('/sports/list', 'supported_sports_list');
    } catch (error) {
      console.error('Error fetching supported sports:', error);
      // Return fallback list if API fails
      return this.getFallbackSportsList();
    }
  }

  // Get fixtures for any sport
  async getSportFixtures(sport, status = 'all', league = null, season = null) {
    try {
      let endpoint = `/sports/${sport}/fixtures`;
      const params = new URLSearchParams();
      
      if (status && status !== 'all') params.append('status', status);
      if (league) params.append('league', league);
      if (season) params.append('season', season);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      const cacheKey = `${sport}_fixtures_${status}_${league || 'all'}_${season || 'current'}`;
      const isLive = status === 'live';
      
      return await this.fetchFromFunction(endpoint, cacheKey, isLive);
    } catch (error) {
      console.error(`Error fetching ${sport} fixtures:`, error);
      return [];
    }
  }

  // Get live matches for a specific sport
  async getLiveSportMatches(sport) {
    return this.getSportFixtures(sport, 'live');
  }

  // Get upcoming matches for a specific sport
  async getUpcomingSportMatches(sport, days = 7) {
    return this.getSportFixtures(sport, 'upcoming');
  }

  // Get completed matches for a specific sport
  async getCompletedSportMatches(sport, days = 7) {
    return this.getSportFixtures(sport, 'completed');
  }

  // Get leagues for any sport
  async getSportLeagues(sport) {
    try {
      const endpoint = `/sports/${sport}/leagues`;
      const cacheKey = `${sport}_leagues`;
      
      return await this.fetchFromFunction(endpoint, cacheKey);
    } catch (error) {
      console.error(`Error fetching ${sport} leagues:`, error);
      return [];
    }
  }

  // Get all live matches from multiple sports
  async getAllLiveMatches(sports = ['football', 'basketball', 'tennis', 'hockey']) {
    try {
      return await this.fetchFromFunction('/matches/live', 'all_live_matches', true);
    } catch (error) {
      console.error('Error fetching all live matches:', error);
      return [];
    }
  }

  // Get all upcoming matches from multiple sports
  async getAllUpcomingMatches(days = 7, sports = ['football', 'basketball', 'tennis', 'hockey']) {
    try {
      const endpoint = `/matches/upcoming?days=${days}`;
      const cacheKey = `all_upcoming_matches_${days}days`;
      
      return await this.fetchFromFunction(endpoint, cacheKey);
    } catch (error) {
      console.error('Error fetching all upcoming matches:', error);
      return [];
    }
  }

  // Popular sports that users will most likely want to see
  getPopularSports() {
    return [
      { id: 'football', name: 'Football', icon: '⚽', color: 'green' },
      { id: 'basketball', name: 'Basketball', icon: '🏀', color: 'orange' },
      { id: 'tennis', name: 'Tennis', icon: '🎾', color: 'yellow' },
      { id: 'hockey', name: 'Hockey', icon: '🏒', color: 'blue' },
      { id: 'volleyball', name: 'Volleyball', icon: '🏐', color: 'red' },
      { id: 'handball', name: 'Handball', icon: '🤾', color: 'purple' },
      { id: 'rugby', name: 'Rugby', icon: '🏉', color: 'brown' },
      { id: 'baseball', name: 'Baseball', icon: '⚾', color: 'gray' }
    ];
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
      { id: 'baseball', name: 'Baseball', icon: '⚾', endpoint: 'baseball' },
      { id: 'american-football', name: 'American Football', icon: '🏈', endpoint: 'american-football' },
      { id: 'mma', name: 'MMA', icon: '🥊', endpoint: 'mma' },
      { id: 'boxing', name: 'Boxing', icon: '🥊', endpoint: 'boxing' },
      { id: 'motorsport', name: 'Motorsport', icon: '🏎️', endpoint: 'motorsport' },
      { id: 'cycling', name: 'Cycling', icon: '🚴', endpoint: 'cycling' },
      { id: 'golf', name: 'Golf', icon: '⛳', endpoint: 'golf' }
    ];
  }

  // Get comprehensive sports data for dashboard
  async getDashboardData(includePopularOnly = true) {
    try {
      const sports = includePopularOnly ? this.getPopularSports() : await this.getSupportedSports();
      
      // Get live matches from all sports
      const liveMatches = await this.getAllLiveMatches();
      
      // Get upcoming matches
      const upcomingMatches = await this.getAllUpcomingMatches(7);
      
      // Group matches by sport
      const groupedLive = this.groupMatchesBySport(liveMatches);
      const groupedUpcoming = this.groupMatchesBySport(upcomingMatches);
      
      return {
        sports: sports,
        liveMatches: liveMatches,
        upcomingMatches: upcomingMatches,
        groupedLive: groupedLive,
        groupedUpcoming: groupedUpcoming,
        summary: {
          totalLive: liveMatches.length,
          totalUpcoming: upcomingMatches.length,
          sportsWithLiveMatches: Object.keys(groupedLive).length,
          sportsWithUpcomingMatches: Object.keys(groupedUpcoming).length
        },
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        sports: this.getPopularSports(),
        liveMatches: [],
        upcomingMatches: [],
        groupedLive: {},
        groupedUpcoming: {},
        summary: {
          totalLive: 0,
          totalUpcoming: 0,
          sportsWithLiveMatches: 0,
          sportsWithUpcomingMatches: 0
        },
        lastUpdated: Date.now(),
        error: error.message
      };
    }
  }

  // Helper method to group matches by sport
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

  // Get detailed statistics for a sport
  async getSportStats(sport) {
    try {
      const [fixtures, leagues] = await Promise.all([
        this.getSportFixtures(sport, 'all'),
        this.getSportLeagues(sport)
      ]);

      const liveCount = fixtures.filter(f => f.status === 'live').length;
      const upcomingCount = fixtures.filter(f => f.status === 'upcoming').length;
      const completedCount = fixtures.filter(f => f.status === 'completed').length;

      return {
        sport: sport,
        totalFixtures: fixtures.length,
        liveMatches: liveCount,
        upcomingMatches: upcomingCount,
        completedMatches: completedCount,
        totalLeagues: leagues.length,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error(`Error fetching ${sport} stats:`, error);
      return {
        sport: sport,
        totalFixtures: 0,
        liveMatches: 0,
        upcomingMatches: 0,
        completedMatches: 0,
        totalLeagues: 0,
        lastUpdated: Date.now(),
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const multiSportAPI = new MultiSportAPIService();

// Export combined function to get all sports data (including cricket)
export async function fetchAllSportsData() {
  try {
    // Import cricket API
    const { fetchCricketData } = await import('./cricketApi.js');
    
    // Get cricket data
    const cricketData = await fetchCricketData();
    
    // Get multi-sport data
    const multiSportData = await multiSportAPI.getDashboardData();
    
    // Combine data
    const allLiveMatches = [...cricketData.live, ...multiSportData.liveMatches];
    const allUpcomingMatches = [...cricketData.upcoming, ...multiSportData.upcomingMatches];
    
    return {
      cricket: cricketData,
      multiSport: multiSportData,
      combined: {
        liveMatches: allLiveMatches,
        upcomingMatches: allUpcomingMatches,
        totalSports: multiSportData.sports.length + 1, // +1 for cricket
        summary: {
          totalLive: allLiveMatches.length,
          totalUpcoming: allUpcomingMatches.length,
          cricketLive: cricketData.live.length,
          otherSportsLive: multiSportData.liveMatches.length
        }
      },
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('Error fetching all sports data:', error);
    return {
      cricket: { live: [], upcoming: [], recent: [], series: [] },
      multiSport: { sports: [], liveMatches: [], upcomingMatches: [] },
      combined: { liveMatches: [], upcomingMatches: [], totalSports: 0 },
      lastUpdated: Date.now(),
      error: error.message
    };
  }
}

export default multiSportAPI;
