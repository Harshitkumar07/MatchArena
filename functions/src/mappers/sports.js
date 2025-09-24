const dayjs = require('dayjs');

/**
 * Normalize match from API-Sports to common format
 */
const normalizeMatch = (rawMatch, sport) => {
  if (!rawMatch) return null;

  // Handle different API-Sports response formats
  const fixture = rawMatch.fixture || rawMatch;
  const teams = rawMatch.teams || { home: rawMatch.home_team, away: rawMatch.away_team };
  const goals = rawMatch.goals || rawMatch.scores || {};
  const league = rawMatch.league || {};

  return {
    id: fixture.id || rawMatch.id,
    sport: sport,
    league: {
      id: league.id || rawMatch.league_id,
      name: league.name || rawMatch.league_name || 'Unknown League',
      country: league.country || rawMatch.country || null
    },
    fixture: {
      startTime: fixture.date || rawMatch.date,
      venue: fixture.venue?.name || rawMatch.venue || null,
      status: {
        short: getStatusShort(fixture.status || rawMatch.status),
        long: getStatusLong(fixture.status || rawMatch.status),
        elapsed: fixture.status?.elapsed || rawMatch.elapsed || null
      }
    },
    teams: {
      home: {
        id: teams.home?.id || rawMatch.home_team?.id,
        name: teams.home?.name || rawMatch.home_team?.name || 'Home Team',
        shortName: getTeamShortName(teams.home?.name || rawMatch.home_team?.name),
        logo: teams.home?.logo || rawMatch.home_team?.logo || null
      },
      away: {
        id: teams.away?.id || rawMatch.away_team?.id,
        name: teams.away?.name || rawMatch.away_team?.name || 'Away Team',
        shortName: getTeamShortName(teams.away?.name || rawMatch.away_team?.name),
        logo: teams.away?.logo || rawMatch.away_team?.logo || null
      }
    },
    score: {
      home: getTeamScore(goals.home || rawMatch.home_score, sport),
      away: getTeamScore(goals.away || rawMatch.away_score, sport),
      detail: getScoreDetail(rawMatch, sport)
    },
    extras: {
      round: league.round || rawMatch.round,
      season: league.season || rawMatch.season,
      timezone: fixture.timezone || rawMatch.timezone,
      referee: fixture.referee || rawMatch.referee
    }
  };
};

/**
 * Get status short code for API-Sports
 */
const getStatusShort = (status) => {
  if (!status) return 'NS';
  
  const shortStatus = status.short || status;
  
  // Map common API-Sports status codes
  const statusMap = {
    'NS': 'NS',    // Not Started
    'LIVE': 'LIVE', // Live
    '1H': 'LIVE',   // First Half
    'HT': 'HT',     // Half Time
    '2H': 'LIVE',   // Second Half
    'ET': 'LIVE',   // Extra Time
    'P': 'LIVE',    // Penalty
    'FT': 'FT',     // Full Time
    'AET': 'FT',    // After Extra Time
    'PEN': 'FT',    // Penalty Shootout
    'CANC': 'CANC', // Cancelled
    'SUSP': 'SUSP', // Suspended
    'AWD': 'AWD',   // Awarded
    'ABD': 'ABD',   // Abandoned
    'WO': 'WO',     // Walkover
    'PST': 'PST'    // Postponed
  };
  
  return statusMap[shortStatus] || shortStatus;
};

/**
 * Get status long description
 */
const getStatusLong = (status) => {
  if (!status) return 'Not Started';
  
  if (typeof status === 'string') {
    return status;
  }
  
  return status.long || status.short || 'Unknown';
};

/**
 * Get team short name
 */
const getTeamShortName = (fullName) => {
  if (!fullName) return '';
  
  // Extract initials from team name
  const words = fullName.split(' ').filter(word => word.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  
  return words.map(word => word[0]).join('').substring(0, 3).toUpperCase();
};

/**
 * Get team score based on sport
 */
const getTeamScore = (score, sport) => {
  if (score === null || score === undefined) {
    return { points: null, details: null };
  }
  
  switch (sport) {
    case 'football':
      return { 
        goals: parseInt(score) || 0,
        points: parseInt(score) || 0,
        details: null
      };
      
    case 'basketball':
      return {
        points: parseInt(score) || 0,
        details: null
      };
      
    case 'tennis':
      return {
        sets: parseInt(score) || 0,
        points: parseInt(score) || 0,
        details: null
      };
      
    case 'hockey':
      return {
        goals: parseInt(score) || 0,
        points: parseInt(score) || 0,
        details: null
      };
      
    default:
      return {
        points: parseInt(score) || 0,
        details: null
      };
  }
};

/**
 * Get score detail string
 */
const getScoreDetail = (match, sport) => {
  const fixture = match.fixture || match;
  const status = fixture.status || match.status;
  
  if (!status) return null;
  
  if (status.short === 'FT' && match.score) {
    const homeScore = match.goals?.home || match.scores?.home || match.home_score;
    const awayScore = match.goals?.away || match.scores?.away || match.away_score;
    
    if (homeScore !== null && awayScore !== null) {
      return `${homeScore} - ${awayScore}`;
    }
  }
  
  return status.long || null;
};

/**
 * Normalize league from API-Sports
 */
const normalizeLeague = (rawLeague) => {
  if (!rawLeague) return null;

  return {
    id: rawLeague.id,
    name: rawLeague.name,
    sport: rawLeague.type || 'football',
    country: rawLeague.country?.name || rawLeague.country,
    logo: rawLeague.logo,
    flag: rawLeague.country?.flag,
    season: rawLeague.seasons?.[0] || null,
    current: rawLeague.seasons?.[0]?.current || false
  };
};

/**
 * Normalize team from API-Sports
 */
const normalizeTeam = (rawTeam) => {
  if (!rawTeam) return null;

  return {
    id: rawTeam.id,
    name: rawTeam.name,
    shortName: getTeamShortName(rawTeam.name),
    logo: rawTeam.logo,
    country: rawTeam.country,
    founded: rawTeam.founded,
    venue: rawTeam.venue
  };
};

/**
 * Format match for display
 */
const formatMatchForDisplay = (match) => {
  if (!match) return null;

  return {
    ...match,
    displayTime: formatMatchTime(match.fixture.startTime),
    shortScore: getShortScore(match),
    statusText: getStatusText(match)
  };
};

/**
 * Format match time for display
 */
const formatMatchTime = (startTime) => {
  if (!startTime) return 'TBD';
  
  const matchTime = dayjs(startTime);
  const now = dayjs();
  
  if (matchTime.isSame(now, 'day')) {
    return matchTime.format('HH:mm');
  } else if (matchTime.diff(now, 'day') <= 7) {
    return matchTime.format('ddd HH:mm');
  } else {
    return matchTime.format('MMM DD');
  }
};

/**
 * Get short score for display
 */
const getShortScore = (match) => {
  const { home, away } = match.score;
  
  if (home.points === null && away.points === null) {
    return match.fixture.status.short === 'NS' ? 'vs' : match.fixture.status.short;
  }
  
  return `${home.points || 0} - ${away.points || 0}`;
};

/**
 * Get status text for display
 */
const getStatusText = (match) => {
  const status = match.fixture.status;
  
  if (status.short === 'LIVE') {
    return status.elapsed ? `${status.elapsed}'` : 'Live';
  } else if (status.short === 'FT') {
    return 'Full Time';
  } else if (status.short === 'HT') {
    return 'Half Time';
  } else if (status.short === 'NS') {
    return formatMatchTime(match.fixture.startTime);
  }
  
  return status.long || status.short;
};

/**
 * Get sport-specific score format
 */
const getFormattedScore = (match) => {
  const { home, away } = match.score;
  
  switch (match.sport) {
    case 'football':
      return `${home.goals || 0} - ${away.goals || 0}`;
    case 'basketball':
      return `${home.points || 0} - ${away.points || 0}`;
    case 'tennis':
      return `${home.sets || 0} - ${away.sets || 0}`;
    default:
      return `${home.points || 0} - ${away.points || 0}`;
  }
};

module.exports = {
  normalizeMatch,
  normalizeLeague,
  normalizeTeam,
  formatMatchForDisplay,
  getStatusShort,
  getStatusLong,
  getFormattedScore
};
