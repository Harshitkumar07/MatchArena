import { BaseSportAdapter, MATCH_STATUS, SPORT_TYPE, AdapterError, ERROR_CODES } from './base';
import { ref, get, query, orderByChild, equalTo, limitToLast, startAt, endAt } from 'firebase/database';
import { database } from '../../firebaseClient';
import { addDays, subDays } from 'date-fns';

/**
 * Football adapter that reads from Firebase Realtime Database
 * Data is populated by Cloud Functions that poll from external APIs
 */
export class FootballAdapter extends BaseSportAdapter {
  constructor() {
    super(SPORT_TYPE.FOOTBALL);
  }

  async getLiveMatches() {
    try {
      const matchesRef = ref(database, `matches/${this.sport}`);
      const liveQuery = query(matchesRef, orderByChild('status'), equalTo(MATCH_STATUS.LIVE));
      const snapshot = await get(liveQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const matches = [];
      snapshot.forEach((child) => {
        matches.push(this.normalizeMatch({
          id: child.key,
          ...child.val()
        }));
      });

      return matches.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error fetching live football matches:', error);
      throw new AdapterError(
        'Failed to fetch live matches',
        ERROR_CODES.API_ERROR,
        { originalError: error.message }
      );
    }
  }

  async getUpcomingMatches(days = 7) {
    try {
      const now = Date.now();
      const futureDate = addDays(new Date(), days).getTime();
      
      const matchesRef = ref(database, `matches/${this.sport}`);
      const upcomingQuery = query(
        matchesRef,
        orderByChild('startsAt'),
        startAt(now),
        endAt(futureDate)
      );
      
      const snapshot = await get(upcomingQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const matches = [];
      snapshot.forEach((child) => {
        const match = child.val();
        if (match.status === MATCH_STATUS.UPCOMING) {
          matches.push(this.normalizeMatch({
            id: child.key,
            ...match
          }));
        }
      });

      return matches.sort((a, b) => a.startsAt - b.startsAt);
    } catch (error) {
      console.error('Error fetching upcoming football matches:', error);
      throw new AdapterError(
        'Failed to fetch upcoming matches',
        ERROR_CODES.API_ERROR,
        { originalError: error.message }
      );
    }
  }

  async getRecentMatches(days = 7) {
    try {
      const now = Date.now();
      const pastDate = subDays(new Date(), days).getTime();
      
      const matchesRef = ref(database, `matches/${this.sport}`);
      const recentQuery = query(
        matchesRef,
        orderByChild('startsAt'),
        startAt(pastDate),
        endAt(now)
      );
      
      const snapshot = await get(recentQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const matches = [];
      snapshot.forEach((child) => {
        const match = child.val();
        if (match.status === MATCH_STATUS.COMPLETED) {
          matches.push(this.normalizeMatch({
            id: child.key,
            ...match
          }));
        }
      });

      return matches.sort((a, b) => b.startsAt - a.startsAt);
    } catch (error) {
      console.error('Error fetching recent football matches:', error);
      throw new AdapterError(
        'Failed to fetch recent matches',
        ERROR_CODES.API_ERROR,
        { originalError: error.message }
      );
    }
  }

  async getMatchDetail(matchId) {
    try {
      const matchRef = ref(database, `matches/${this.sport}/${matchId}`);
      const snapshot = await get(matchRef);
      
      if (!snapshot.exists()) {
        throw new AdapterError(
          'Match not found',
          ERROR_CODES.NOT_FOUND,
          { matchId }
        );
      }

      return this.normalizeMatch({
        id: matchId,
        ...snapshot.val()
      });
    } catch (error) {
      if (error instanceof AdapterError) throw error;
      
      console.error('Error fetching football match detail:', error);
      throw new AdapterError(
        'Failed to fetch match detail',
        ERROR_CODES.API_ERROR,
        { originalError: error.message }
      );
    }
  }

  async getSeries() {
    try {
      const seriesRef = ref(database, `series/${this.sport}`);
      const snapshot = await get(seriesRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const series = [];
      snapshot.forEach((child) => {
        series.push(this.normalizeSeries({
          id: child.key,
          ...child.val()
        }));
      });

      return series.sort((a, b) => b.startsAt - a.startsAt);
    } catch (error) {
      console.error('Error fetching football series:', error);
      throw new AdapterError(
        'Failed to fetch series',
        ERROR_CODES.API_ERROR,
        { originalError: error.message }
      );
    }
  }

  async getSeriesDetail(seriesId) {
    try {
      const seriesRef = ref(database, `series/${this.sport}/${seriesId}`);
      const snapshot = await get(seriesRef);
      
      if (!snapshot.exists()) {
        throw new AdapterError(
          'Series not found',
          ERROR_CODES.NOT_FOUND,
          { seriesId }
        );
      }

      const seriesData = snapshot.val();
      
      // Fetch all matches for this series
      if (seriesData.matches) {
        const matchPromises = Object.keys(seriesData.matches).map(matchId => 
          this.getMatchDetail(matchId).catch(() => null)
        );
        const matches = await Promise.all(matchPromises);
        seriesData.matchDetails = matches.filter(m => m !== null);
      }

      return this.normalizeSeries({
        id: seriesId,
        ...seriesData
      });
    } catch (error) {
      if (error instanceof AdapterError) throw error;
      
      console.error('Error fetching football series detail:', error);
      throw new AdapterError(
        'Failed to fetch series detail',
        ERROR_CODES.API_ERROR,
        { originalError: error.message }
      );
    }
  }

  async getTeamInfo(teamId) {
    return {
      id: teamId,
      name: teamId,
      sport: this.sport,
      // Add more team details when available
    };
  }

  async getPlayerInfo(playerId) {
    return {
      id: playerId,
      name: playerId,
      sport: this.sport,
      position: 'Unknown',
      // Add more player details when available
    };
  }

  async searchMatches(query) {
    try {
      const allMatchesRef = ref(database, `matches/${this.sport}`);
      const snapshot = await get(allMatchesRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const searchTerm = query.toLowerCase();
      const matches = [];
      
      snapshot.forEach((child) => {
        const match = child.val();
        const homeTeam = (match.teams?.home || '').toLowerCase();
        const awayTeam = (match.teams?.away || '').toLowerCase();
        const venue = (match.venue || '').toLowerCase();
        const competition = (match.competition || '').toLowerCase();
        
        if (homeTeam.includes(searchTerm) || 
            awayTeam.includes(searchTerm) || 
            venue.includes(searchTerm) ||
            competition.includes(searchTerm)) {
          matches.push(this.normalizeMatch({
            id: child.key,
            ...match
          }));
        }
      });

      return matches;
    } catch (error) {
      console.error('Error searching football matches:', error);
      throw new AdapterError(
        'Failed to search matches',
        ERROR_CODES.API_ERROR,
        { originalError: error.message }
      );
    }
  }

  normalizeMatch(rawMatch) {
    if (!rawMatch) return null;

    // Calculate match result for completed matches
    let result = null;
    let winnerTeamId = null;
    
    if (rawMatch.status === MATCH_STATUS.COMPLETED && rawMatch.scores) {
      const homeGoals = rawMatch.scores.home?.goals || 0;
      const awayGoals = rawMatch.scores.away?.goals || 0;
      
      if (homeGoals > awayGoals) {
        winnerTeamId = rawMatch.teams?.home;
        result = `${rawMatch.teams?.home} won ${homeGoals}-${awayGoals}`;
      } else if (awayGoals > homeGoals) {
        winnerTeamId = rawMatch.teams?.away;
        result = `${rawMatch.teams?.away} won ${awayGoals}-${homeGoals}`;
      } else {
        result = `Draw ${homeGoals}-${awayGoals}`;
      }
      
      // Handle penalty shootouts if present
      if (rawMatch.scores.penalties) {
        const homePenalties = rawMatch.scores.penalties.home || 0;
        const awayPenalties = rawMatch.scores.penalties.away || 0;
        result += ` (${homePenalties}-${awayPenalties} on penalties)`;
        
        if (homePenalties > awayPenalties) {
          winnerTeamId = rawMatch.teams?.home;
        } else if (awayPenalties > homePenalties) {
          winnerTeamId = rawMatch.teams?.away;
        }
      }
    }

    return {
      id: rawMatch.id,
      sport: this.sport,
      seriesId: rawMatch.seriesId,
      seriesName: rawMatch.seriesName || rawMatch.competition,
      status: rawMatch.status,
      teams: {
        home: {
          id: rawMatch.teams?.home,
          name: rawMatch.teams?.home,
          shortName: rawMatch.teams?.home?.substring(0, 3)?.toUpperCase(),
          logo: rawMatch.teams?.homeLogo || null
        },
        away: {
          id: rawMatch.teams?.away,
          name: rawMatch.teams?.away,
          shortName: rawMatch.teams?.away?.substring(0, 3)?.toUpperCase(),
          logo: rawMatch.teams?.awayLogo || null
        }
      },
      scores: rawMatch.scores || {
        home: { goals: 0 },
        away: { goals: 0 }
      },
      venue: rawMatch.venue,
      startsAt: rawMatch.startsAt,
      updatedAt: rawMatch.updatedAt || Date.now(),
      matchType: rawMatch.competition || 'Friendly',
      timeline: rawMatch.timeline || {},
      result,
      winnerTeamId,
      metadata: {
        competition: rawMatch.competition,
        round: rawMatch.round,
        referee: rawMatch.referee,
        attendance: rawMatch.attendance,
        currentMinute: rawMatch.timeline?.currentMinute,
        halfTime: rawMatch.timeline?.halfTime,
        fullTime: rawMatch.timeline?.fullTime,
        extraTime: rawMatch.timeline?.extraTime,
        penalties: rawMatch.scores?.penalties,
        cards: rawMatch.timeline?.cards || [],
        substitutions: rawMatch.timeline?.substitutions || [],
        goals: rawMatch.timeline?.goals || [],
        source: rawMatch.source
      }
    };
  }

  normalizeSeries(rawSeries) {
    if (!rawSeries) return null;

    // Determine series status based on dates
    const now = Date.now();
    let status = 'upcoming';
    
    if (rawSeries.startsAt && rawSeries.endsAt) {
      if (now < rawSeries.startsAt) {
        status = 'upcoming';
      } else if (now > rawSeries.endsAt) {
        status = 'completed';
      } else {
        status = 'ongoing';
      }
    }

    return {
      id: rawSeries.id,
      sport: this.sport,
      name: rawSeries.name,
      season: rawSeries.season,
      startDate: rawSeries.startsAt,
      endDate: rawSeries.endsAt,
      teams: rawSeries.teams || [],
      matches: rawSeries.matches ? Object.keys(rawSeries.matches) : [],
      matchDetails: rawSeries.matchDetails || [],
      standings: this.normalizeStandings(rawSeries.standings),
      status,
      metadata: {
        description: rawSeries.description,
        format: rawSeries.format,
        totalMatches: rawSeries.matches ? Object.keys(rawSeries.matches).length : 0,
        country: rawSeries.country,
        type: rawSeries.type // league, cup, international
      }
    };
  }

  normalizeStandings(standings) {
    if (!standings || !Array.isArray(standings)) return [];
    
    return standings.map(team => ({
      position: team.position,
      teamId: team.teamId,
      teamName: team.teamName,
      played: team.played || 0,
      won: team.won || 0,
      drawn: team.drawn || 0,
      lost: team.lost || 0,
      goalsFor: team.goalsFor || 0,
      goalsAgainst: team.goalsAgainst || 0,
      goalDifference: (team.goalsFor || 0) - (team.goalsAgainst || 0),
      points: team.points || 0,
      form: team.form || []
    }));
  }
}

// Export singleton instance
export default new FootballAdapter();
