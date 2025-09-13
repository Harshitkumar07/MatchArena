/**
 * Cricket API Service
 * Uses CricAPI or similar free cricket data sources
 */

import { BaseSportAdapter, MATCH_STATUS, AdapterError, ERROR_CODES } from '../adapters/base';

// Using a free cricket API endpoint
const CRICKET_API_BASE = 'https://api.cricapi.com/v1';
const BACKUP_API_BASE = 'https://cricket-live-data.p.rapidapi.com';

// You can get a free API key from cricapi.com
const API_KEY = process.env.REACT_APP_CRICKET_API_KEY || 'demo_key';

class CricketAPIService extends BaseSportAdapter {
  constructor() {
    super('cricket');
    this.apiKey = API_KEY;
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  async fetchWithCache(url, cacheKey, options = {}) {
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new AdapterError(
          `API request failed: ${response.statusText}`,
          ERROR_CODES.API_ERROR,
          { status: response.status }
        );
      }

      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Cricket API Error:', error);
      throw new AdapterError(
        'Failed to fetch cricket data',
        ERROR_CODES.NETWORK_ERROR,
        { originalError: error.message }
      );
    }
  }

  async getLiveMatches() {
    try {
      // For demo purposes, return sample data
      // In production, use actual API endpoint
      const sampleMatches = [
        {
          id: 'match_' + Date.now() + '_1',
          sport: 'cricket',
          seriesId: 'ipl_2024',
          seriesName: 'Indian Premier League 2024',
          status: 'live',
          teams: {
            home: {
              id: 'mi',
              name: 'Mumbai Indians',
              shortName: 'MI',
              logo: 'https://via.placeholder.com/50'
            },
            away: {
              id: 'csk',
              name: 'Chennai Super Kings',
              shortName: 'CSK',
              logo: 'https://via.placeholder.com/50'
            }
          },
          scores: {
            home: {
              runs: 156,
              wickets: 4,
              overs: 16.3,
              runRate: 9.45
            },
            away: {
              runs: 178,
              wickets: 6,
              overs: 20,
              runRate: 8.9
            }
          },
          venue: 'Wankhede Stadium, Mumbai',
          startsAt: Date.now() - 7200000, // 2 hours ago
          updatedAt: Date.now(),
          matchType: 'T20',
          currentInning: 2,
          currentOver: 16.3,
          result: null,
          metadata: {
            tossWinner: 'csk',
            tossDecision: 'bat',
            currentBatsmen: [
              { name: 'Rohit Sharma', runs: 45, balls: 32, fours: 4, sixes: 2 },
              { name: 'Hardik Pandya', runs: 23, balls: 15, fours: 2, sixes: 1 }
            ],
            currentBowler: { name: 'MS Dhoni', overs: 3.3, runs: 28, wickets: 1 },
            recentOvers: ['1 4 W 2 1 0', '6 1 1 4 2 1', '0 1 2 4']
          }
        },
        {
          id: 'match_' + Date.now() + '_2',
          sport: 'cricket',
          seriesId: 'test_series_2024',
          seriesName: 'India vs Australia Test Series',
          status: 'live',
          teams: {
            home: {
              id: 'ind',
              name: 'India',
              shortName: 'IND',
              logo: 'https://via.placeholder.com/50'
            },
            away: {
              id: 'aus',
              name: 'Australia',
              shortName: 'AUS',
              logo: 'https://via.placeholder.com/50'
            }
          },
          scores: {
            home: {
              firstInnings: { runs: 445, wickets: 10, overs: 123.4 },
              secondInnings: { runs: 234, wickets: 5, overs: 67.2 }
            },
            away: {
              firstInnings: { runs: 389, wickets: 10, overs: 98.5 },
              secondInnings: null
            }
          },
          venue: 'M. Chinnaswamy Stadium, Bengaluru',
          startsAt: Date.now() - 172800000, // 2 days ago
          updatedAt: Date.now(),
          matchType: 'Test',
          currentDay: 3,
          currentSession: 'post-lunch',
          result: null,
          metadata: {
            tossWinner: 'ind',
            tossDecision: 'bat',
            currentPartnership: 45,
            lastWicket: 'Virat Kohli c Smith b Cummins 76(134)'
          }
        }
      ];

      return sampleMatches;
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return [];
    }
  }

  async getUpcomingMatches(days = 7) {
    try {
      const upcomingMatches = [
        {
          id: 'match_upcoming_1',
          sport: 'cricket',
          seriesId: 'ipl_2024',
          seriesName: 'Indian Premier League 2024',
          status: 'upcoming',
          teams: {
            home: {
              id: 'rcb',
              name: 'Royal Challengers Bangalore',
              shortName: 'RCB',
              logo: 'https://via.placeholder.com/50'
            },
            away: {
              id: 'kkr',
              name: 'Kolkata Knight Riders',
              shortName: 'KKR',
              logo: 'https://via.placeholder.com/50'
            }
          },
          venue: 'M. Chinnaswamy Stadium, Bengaluru',
          startsAt: Date.now() + 3600000, // 1 hour from now
          matchType: 'T20',
          metadata: {
            matchNumber: 45,
            stage: 'League',
            broadcaster: 'Star Sports'
          }
        },
        {
          id: 'match_upcoming_2',
          sport: 'cricket',
          seriesId: 'world_cup_2024',
          seriesName: 'ICC World Cup 2024',
          status: 'upcoming',
          teams: {
            home: {
              id: 'eng',
              name: 'England',
              shortName: 'ENG',
              logo: 'https://via.placeholder.com/50'
            },
            away: {
              id: 'nz',
              name: 'New Zealand',
              shortName: 'NZ',
              logo: 'https://via.placeholder.com/50'
            }
          },
          venue: 'Lords, London',
          startsAt: Date.now() + 86400000, // Tomorrow
          matchType: 'ODI',
          metadata: {
            matchNumber: 23,
            stage: 'Group Stage',
            group: 'Group A'
          }
        }
      ];

      return upcomingMatches;
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      return [];
    }
  }

  async getRecentMatches(days = 7) {
    try {
      const recentMatches = [
        {
          id: 'match_recent_1',
          sport: 'cricket',
          seriesId: 'ipl_2024',
          seriesName: 'Indian Premier League 2024',
          status: 'completed',
          teams: {
            home: {
              id: 'dc',
              name: 'Delhi Capitals',
              shortName: 'DC',
              logo: 'https://via.placeholder.com/50'
            },
            away: {
              id: 'pbks',
              name: 'Punjab Kings',
              shortName: 'PBKS',
              logo: 'https://via.placeholder.com/50'
            }
          },
          scores: {
            home: {
              runs: 189,
              wickets: 7,
              overs: 20,
              runRate: 9.45
            },
            away: {
              runs: 185,
              wickets: 9,
              overs: 20,
              runRate: 9.25
            }
          },
          venue: 'Arun Jaitley Stadium, Delhi',
          startsAt: Date.now() - 86400000, // Yesterday
          updatedAt: Date.now() - 82800000,
          matchType: 'T20',
          result: 'Delhi Capitals won by 4 runs',
          winnerTeamId: 'dc',
          metadata: {
            playerOfMatch: 'Rishabh Pant',
            highestScore: { player: 'Shikhar Dhawan', runs: 67, balls: 45 },
            bestBowling: { player: 'Kuldeep Yadav', wickets: 3, runs: 28, overs: 4 }
          }
        }
      ];

      return recentMatches;
    } catch (error) {
      console.error('Error fetching recent matches:', error);
      return [];
    }
  }

  async getMatchDetail(matchId) {
    try {
      // Return detailed match data
      return {
        id: matchId,
        sport: 'cricket',
        // ... full match details including scorecard, commentary, etc.
      };
    } catch (error) {
      throw new AdapterError(
        'Failed to fetch match details',
        ERROR_CODES.API_ERROR,
        { matchId, error: error.message }
      );
    }
  }

  async getSeries() {
    try {
      const series = [
        {
          id: 'ipl_2024',
          sport: 'cricket',
          name: 'Indian Premier League 2024',
          season: '2024',
          startDate: Date.now() - 2592000000, // 30 days ago
          endDate: Date.now() + 2592000000, // 30 days from now
          status: 'ongoing',
          teams: [
            { id: 'mi', name: 'Mumbai Indians', matches: 10, won: 6, lost: 4, points: 12 },
            { id: 'csk', name: 'Chennai Super Kings', matches: 10, won: 7, lost: 3, points: 14 },
            { id: 'rcb', name: 'Royal Challengers Bangalore', matches: 9, won: 5, lost: 4, points: 10 },
            { id: 'kkr', name: 'Kolkata Knight Riders', matches: 10, won: 6, lost: 4, points: 12 }
          ],
          metadata: {
            format: 'T20',
            totalMatches: 74,
            completedMatches: 45,
            currentLeader: 'csk'
          }
        },
        {
          id: 'world_cup_2024',
          sport: 'cricket',
          name: 'ICC World Cup 2024',
          season: '2024',
          startDate: Date.now() + 5184000000, // 60 days from now
          endDate: Date.now() + 7776000000, // 90 days from now
          status: 'upcoming',
          teams: [],
          metadata: {
            format: 'ODI',
            totalMatches: 48,
            host: 'India'
          }
        }
      ];

      return series;
    } catch (error) {
      console.error('Error fetching series:', error);
      return [];
    }
  }

  normalizeMatch(rawMatch) {
    // Normalize raw API response to standard format
    return {
      id: rawMatch.id || rawMatch.match_id,
      sport: 'cricket',
      // ... map other fields
    };
  }

  normalizeSeries(rawSeries) {
    // Normalize raw API response to standard format
    return {
      id: rawSeries.id || rawSeries.series_id,
      sport: 'cricket',
      // ... map other fields
    };
  }
}

// Export singleton instance
export const cricketAPI = new CricketAPIService();

// Export function to get all cricket data
export async function fetchCricketData() {
  try {
    const [liveMatches, upcomingMatches, recentMatches, series] = await Promise.all([
      cricketAPI.getLiveMatches(),
      cricketAPI.getUpcomingMatches(7),
      cricketAPI.getRecentMatches(7),
      cricketAPI.getSeries()
    ]);

    return {
      live: liveMatches,
      upcoming: upcomingMatches,
      recent: recentMatches,
      series: series,
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('Error fetching cricket data:', error);
    return {
      live: [],
      upcoming: [],
      recent: [],
      series: [],
      lastUpdated: Date.now(),
      error: error.message
    };
  }
}

export default cricketAPI;