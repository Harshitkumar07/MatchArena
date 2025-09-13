import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { formatDistanceToNow } from 'date-fns';

const MatchCard = ({ match, sport = 'cricket', compact = false }) => {
  const { isDark } = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'text-red-500';
      case 'upcoming':
        return 'text-blue-500';
      case 'completed':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return (
          <span className="flex items-center space-x-1">
            <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-semibold text-red-500">LIVE</span>
          </span>
        );
      case 'upcoming':
        return <span className="text-xs font-semibold text-blue-500">UPCOMING</span>;
      case 'completed':
        return <span className="text-xs font-semibold text-gray-500">COMPLETED</span>;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <Link
        to={`/sport/${sport}/match/${match.id || match.key}`}
        className={`block py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate">
                {match.teams?.home?.name || match.teams?.home || 'Team A'} vs {match.teams?.away?.name || match.teams?.away || 'Team B'}
              </span>
              {getStatusBadge(match.status)}
            </div>
            {match.status === 'live' && match.scores && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {match.scores.home?.runs}/{match.scores.home?.wickets} ({match.scores.home?.overs}) • 
                {match.scores.away?.runs}/{match.scores.away?.wickets} ({match.scores.away?.overs})
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md hover:shadow-lg transition-shadow p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">
            {match.seriesName || match.matchType || 'Match'}
          </h3>
          <p className="text-sm text-gray-500">
            {match.venue || 'Venue TBD'}
          </p>
        </div>
        {getStatusBadge(match.status)}
      </div>

      <div className="space-y-3">
        {/* Team 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {(match.teams?.home?.logo || match.teams?.homeImg) && (
              <img 
                src={match.teams?.home?.logo || match.teams?.homeImg} 
                alt={match.teams?.home?.name || match.teams?.home || 'Team'}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}
            <span className="font-medium">{match.teams?.home?.name || match.teams?.home || 'Team A'}</span>
          </div>
          {match.scores?.home && (
            <span className="font-semibold">
              {match.scores.home.runs}/{match.scores.home.wickets} 
              <span className="text-sm text-gray-500 ml-1">({match.scores.home.overs})</span>
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {(match.teams?.away?.logo || match.teams?.awayImg) && (
              <img 
                src={match.teams?.away?.logo || match.teams?.awayImg} 
                alt={match.teams?.away?.name || match.teams?.away || 'Team'}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}
            <span className="font-medium">{match.teams?.away?.name || match.teams?.away || 'Team B'}</span>
          </div>
          {match.scores?.away && (
            <span className="font-semibold">
              {match.scores.away.runs}/{match.scores.away.wickets}
              <span className="text-sm text-gray-500 ml-1">({match.scores.away.overs})</span>
            </span>
          )}
        </div>
      </div>

      {/* Match Status or Result */}
      {match.statusNote && (
        <p className={`mt-4 text-sm ${getStatusColor(match.status)}`}>
          {match.statusNote}
        </p>
      )}

      {/* Time Info */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {match.startsAt ? 
            formatDistanceToNow(new Date(match.startsAt), { addSuffix: true }) : 
            'Time TBD'}
        </span>
        <Link
          to={`/sport/${sport}/match/${match.id || match.key}`}
          className="text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default MatchCard;
