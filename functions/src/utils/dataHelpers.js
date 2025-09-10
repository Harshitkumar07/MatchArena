const { v4: uuidv4 } = require('uuid');

// Normalize match data from different API sources
function normalizeMatchData(rawMatch, sport) {
  switch (sport) {
    case 'cricket':
      return normalizeCricketMatch(rawMatch);
    case 'football':
      return normalizeFootballMatch(rawMatch);
    case 'basketball':
      return normalizeBasketballMatch(rawMatch);
    case 'tennis':
      return normalizeTennisMatch(rawMatch);
    case 'baseball':
      return normalizeBaseballMatch(rawMatch);
    default:
      return normalizeGenericMatch(rawMatch, sport);
  }
}

// Normalize cricket match data
function normalizeCricketMatch(match) {
  return {
    id: match.id || match._id || uuidv4(),
    sport: 'cricket',
    homeTeam: match.teams?.[0] || match.teamInfo?.[0]?.name || 'TBA',
    awayTeam: match.teams?.[1] || match.teamInfo?.[1]?.name || 'TBA',
    homeScore: parseScore(match.score?.[0]) || 0,
    awayScore: parseScore(match.score?.[1]) || 0,
    status: mapCricketStatus(match.matchStatus || match.status),
    startTime: match.dateTimeGMT || match.date || new Date().toISOString(),
    venue: match.venue || 'TBA',
    competition: match.series || match.league || null,
    matchType: match.matchType || 'T20',
    currentInning: match.currentInning || null,
    currentOver: match.currentOver || null,
    result: match.status === 'Match Ended' ? match.result : null,
    tossWinner: match.tossWinner || null,
    tossDecision: match.tossDecision || null,
    umpires: match.umpires || [],
    stats: {
      homeTeam: {
        runs: match.score?.[0]?.r || 0,
        wickets: match.score?.[0]?.w || 0,
        overs: match.score?.[0]?.o || 0,
      },
      awayTeam: {
        runs: match.score?.[1]?.r || 0,
        wickets: match.score?.[1]?.w || 0,
        overs: match.score?.[1]?.o || 0,
      },
    },
  };
}

// Normalize football match data
function normalizeFootballMatch(match) {
  return {
    id: match.id || uuidv4(),
    sport: 'football',
    homeTeam: match.homeTeam?.name || 'TBA',
    awayTeam: match.awayTeam?.name || 'TBA',
    homeScore: match.score?.fullTime?.homeTeam ?? 0,
    awayScore: match.score?.fullTime?.awayTeam ?? 0,
    status: mapFootballStatus(match.status),
    startTime: match.utcDate || new Date().toISOString(),
    venue: match.venue || 'TBA',
    competition: match.competition?.name || null,
    currentTime: match.minute || null,
    halfTimeScore: {
      home: match.score?.halfTime?.homeTeam || 0,
      away: match.score?.halfTime?.awayTeam || 0,
    },
    referee: match.referees?.[0]?.name || null,
    attendance: match.attendance || null,
    stats: {
      possession: match.possession || {},
      shots: match.shots || {},
      corners: match.corners || {},
      fouls: match.fouls || {},
    },
  };
}

// Normalize basketball match data
function normalizeBasketballMatch(match) {
  return {
    id: match.GameID || match.id || uuidv4(),
    sport: 'basketball',
    homeTeam: match.HomeTeam || match.homeTeam || 'TBA',
    awayTeam: match.AwayTeam || match.awayTeam || 'TBA',
    homeScore: match.HomeTeamScore || 0,
    awayScore: match.AwayTeamScore || 0,
    status: mapBasketballStatus(match.Status),
    startTime: match.DateTime || new Date().toISOString(),
    venue: match.Stadium?.Name || 'TBA',
    competition: match.Season?.Name || 'Regular Season',
    currentQuarter: match.Quarter || null,
    timeRemaining: match.TimeRemainingMinutes || null,
    stats: {
      homeTeam: {
        fieldGoals: match.HomeTeamStats?.FieldGoalsMade || 0,
        threePointers: match.HomeTeamStats?.ThreePointersMade || 0,
        freeThrows: match.HomeTeamStats?.FreeThrowsMade || 0,
        rebounds: match.HomeTeamStats?.Rebounds || 0,
        assists: match.HomeTeamStats?.Assists || 0,
      },
      awayTeam: {
        fieldGoals: match.AwayTeamStats?.FieldGoalsMade || 0,
        threePointers: match.AwayTeamStats?.ThreePointersMade || 0,
        freeThrows: match.AwayTeamStats?.FreeThrowsMade || 0,
        rebounds: match.AwayTeamStats?.Rebounds || 0,
        assists: match.AwayTeamStats?.Assists || 0,
      },
    },
  };
}

// Normalize tennis match data
function normalizeTennisMatch(match) {
  return {
    id: match.id || uuidv4(),
    sport: 'tennis',
    homeTeam: match.player1?.name || 'TBA',
    awayTeam: match.player2?.name || 'TBA',
    homeScore: calculateTennisScore(match.score, 0),
    awayScore: calculateTennisScore(match.score, 1),
    status: mapTennisStatus(match.status),
    startTime: match.scheduled || new Date().toISOString(),
    venue: match.venue?.name || 'TBA',
    competition: match.tournament?.name || null,
    surface: match.surface || 'Hard',
    currentSet: match.currentSet || null,
    sets: match.score?.sets || [],
    serving: match.serving || null,
  };
}

// Normalize baseball match data
function normalizeBaseballMatch(match) {
  return {
    id: match.id || uuidv4(),
    sport: 'baseball',
    homeTeam: match.home?.name || 'TBA',
    awayTeam: match.away?.name || 'TBA',
    homeScore: match.home?.runs || 0,
    awayScore: match.away?.runs || 0,
    status: mapBaseballStatus(match.status),
    startTime: match.scheduled || new Date().toISOString(),
    venue: match.venue?.name || 'TBA',
    competition: match.league || 'MLB',
    currentInning: match.inning || null,
    outs: match.outs || 0,
    balls: match.balls || 0,
    strikes: match.strikes || 0,
    onBase: {
      first: match.onFirst || false,
      second: match.onSecond || false,
      third: match.onThird || false,
    },
  };
}

// Generic match normalization
function normalizeGenericMatch(match, sport) {
  return {
    id: match.id || uuidv4(),
    sport,
    homeTeam: match.homeTeam || 'TBA',
    awayTeam: match.awayTeam || 'TBA',
    homeScore: match.homeScore || 0,
    awayScore: match.awayScore || 0,
    status: match.status || 'upcoming',
    startTime: match.startTime || new Date().toISOString(),
    venue: match.venue || 'TBA',
    competition: match.competition || null,
  };
}

// Helper functions for status mapping
function mapCricketStatus(status) {
  const statusMap = {
    'Match not started': 'upcoming',
    'Match Started': 'live',
    'Match Ended': 'completed',
    'Match Abandoned': 'cancelled',
  };
  return statusMap[status] || 'upcoming';
}

function mapFootballStatus(status) {
  const statusMap = {
    'SCHEDULED': 'upcoming',
    'IN_PLAY': 'live',
    'PAUSED': 'live',
    'FINISHED': 'completed',
    'POSTPONED': 'postponed',
    'CANCELLED': 'cancelled',
  };
  return statusMap[status] || 'upcoming';
}

function mapBasketballStatus(status) {
  const statusMap = {
    'Scheduled': 'upcoming',
    'InProgress': 'live',
    'Final': 'completed',
    'Postponed': 'postponed',
    'Cancelled': 'cancelled',
  };
  return statusMap[status] || 'upcoming';
}

function mapTennisStatus(status) {
  const statusMap = {
    'not_started': 'upcoming',
    'in_progress': 'live',
    'finished': 'completed',
    'cancelled': 'cancelled',
  };
  return statusMap[status] || 'upcoming';
}

function mapBaseballStatus(status) {
  const statusMap = {
    'scheduled': 'upcoming',
    'inprogress': 'live',
    'final': 'completed',
    'postponed': 'postponed',
  };
  return statusMap[status] || 'upcoming';
}

// Parse cricket score
function parseScore(scoreObj) {
  if (typeof scoreObj === 'number') return scoreObj;
  if (typeof scoreObj === 'string') {
    const match = scoreObj.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }
  if (scoreObj && typeof scoreObj === 'object') {
    return scoreObj.r || scoreObj.runs || 0;
  }
  return 0;
}

// Calculate tennis score
function calculateTennisScore(score, playerIndex) {
  if (!score || !score.sets) return 0;
  return score.sets.filter(set => {
    const games = set.split('-');
    return parseInt(games[playerIndex]) > parseInt(games[1 - playerIndex]);
  }).length;
}

// Sanitize and validate data
function sanitizeData(data) {
  if (typeof data === 'string') {
    return data.replace(/<[^>]*>?/gm, '').trim();
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  return data;
}

module.exports = {
  normalizeMatchData,
  sanitizeData,
};
