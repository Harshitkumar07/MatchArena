const dayjs = require('dayjs');

/**
 * Normalize cricket match from CricAPI to common format
 */
const normalizeMatch = (rawMatch) => {
  if (!rawMatch) return null;

  return {
    id: rawMatch.id,
    sport: 'cricket',
    league: {
      id: rawMatch.series_id || 'unknown',
      name: rawMatch.series || rawMatch.seriesName || 'Unknown Series',
      country: rawMatch.venue?.split(',').pop()?.trim() || null
    },
    fixture: {
      startTime: rawMatch.dateTimeGMT || rawMatch.date,
      venue: rawMatch.venue || null,
      status: {
        short: getStatusShort(rawMatch),
        long: getStatusLong(rawMatch),
        elapsed: getElapsed(rawMatch)
      }
    },
    teams: {
      home: {
        id: rawMatch.team1?.id || rawMatch.teamInfo?.[0]?.id,
        name: rawMatch.team1?.name || rawMatch.teamInfo?.[0]?.name || rawMatch.t1,
        shortName: rawMatch.team1?.shortName || rawMatch.t1s,
        logo: rawMatch.team1?.img || null
      },
      away: {
        id: rawMatch.team2?.id || rawMatch.teamInfo?.[1]?.id,
        name: rawMatch.team2?.name || rawMatch.teamInfo?.[1]?.name || rawMatch.t2,
        shortName: rawMatch.team2?.shortName || rawMatch.t2s,
        logo: rawMatch.team2?.img || null
      }
    },
    score: {
      home: getTeamScore(rawMatch, 'team1'),
      away: getTeamScore(rawMatch, 'team2'),
      detail: rawMatch.status || rawMatch.matchWinner || null
    },
    extras: {
      matchType: rawMatch.matchType,
      tossWinner: rawMatch.tossWinner,
      tossChoice: rawMatch.tossChoice,
      umpires: rawMatch.umpires,
      referee: rawMatch.referee,
      bbbEnabled: rawMatch.bbbEnabled,
      hasSquad: rawMatch.hasSquad,
      fantasyEnabled: rawMatch.fantasyEnabled
    }
  };
};

/**
 * Get status short code
 */
const getStatusShort = (match) => {
  if (match.matchEnded) return 'FT';
  if (match.matchStarted) return 'LIVE';
  return 'NS';
};

/**
 * Get status long description
 */
const getStatusLong = (match) => {
  if (match.matchEnded) {
    return match.status || 'Match Finished';
  }
  if (match.matchStarted) {
    return match.status || 'Live';
  }
  return 'Not Started';
};

/**
 * Get elapsed time for live matches
 */
const getElapsed = (match) => {
  if (!match.matchStarted || match.matchEnded) return null;
  
  if (match.dateTimeGMT) {
    const startTime = dayjs(match.dateTimeGMT);
    const now = dayjs();
    const elapsed = now.diff(startTime, 'minute');
    return elapsed > 0 ? elapsed : null;
  }
  
  return null;
};

/**
 * Get team score from various possible fields
 */
const getTeamScore = (match, team) => {
  const scoreData = match.score || {};
  
  // Try different possible score formats
  if (scoreData[team]) {
    const teamScore = scoreData[team];
    return {
      runs: teamScore.runs || teamScore.r || null,
      wickets: teamScore.wickets || teamScore.w || null,
      overs: teamScore.overs || teamScore.o || null
    };
  }
  
  // Try alternative formats
  if (match[`${team}Score`]) {
    return parseScoreString(match[`${team}Score`]);
  }
  
  return {
    runs: null,
    wickets: null,
    overs: null
  };
};

/**
 * Parse score string like "287/4 (48.3)"
 */
const parseScoreString = (scoreStr) => {
  if (!scoreStr || typeof scoreStr !== 'string') return { runs: null, wickets: null, overs: null };
  
  const match = scoreStr.match(/(\d+)(?:\/(\d+))?\s*(?:\(([0-9.]+)\))?/);
  if (!match) return { runs: null, wickets: null, overs: null };
  
  return {
    runs: parseInt(match[1]) || null,
    wickets: match[2] ? parseInt(match[2]) : null,
    overs: match[3] ? parseFloat(match[3]) : null
  };
};

/**
 * Normalize cricket series
 */
const normalizeSeries = (rawSeries) => {
  if (!rawSeries) return null;

  return {
    id: rawSeries.id,
    name: rawSeries.name,
    sport: 'cricket',
    status: rawSeries.status || 'active',
    startDate: rawSeries.startDate,
    endDate: rawSeries.endDate,
    matches: rawSeries.matches || 0,
    odi: rawSeries.odi || 0,
    t20: rawSeries.t20 || 0,
    test: rawSeries.test || 0,
    squads: rawSeries.squads || 0
  };
};

/**
 * Format match for display
 */
const formatMatchForDisplay = (match) => {
  const normalized = normalizeMatch(match);
  if (!normalized) return null;

  return {
    ...normalized,
    displayTime: formatMatchTime(normalized.fixture.startTime),
    shortScore: getShortScore(normalized),
    statusText: getStatusText(normalized)
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
  
  if (!home.runs && !away.runs) {
    return match.fixture.status.short === 'NS' ? 'vs' : match.fixture.status.short;
  }
  
  const homeScore = home.runs ? `${home.runs}${home.wickets !== null ? `/${home.wickets}` : ''}` : '';
  const awayScore = away.runs ? `${away.runs}${away.wickets !== null ? `/${away.wickets}` : ''}` : '';
  
  return `${homeScore} - ${awayScore}`;
};

/**
 * Get status text for display
 */
const getStatusText = (match) => {
  const status = match.fixture.status;
  
  if (status.short === 'LIVE') {
    return 'Live';
  } else if (status.short === 'FT') {
    return 'Finished';
  } else if (status.short === 'NS') {
    return formatMatchTime(match.fixture.startTime);
  }
  
  return status.long;
};

module.exports = {
  normalizeMatch,
  normalizeSeries,
  formatMatchForDisplay,
  getStatusShort,
  getStatusLong
};
