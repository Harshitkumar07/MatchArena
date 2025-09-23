import React, { useState, useEffect } from 'react';
import { ChevronRight, Play, Clock } from 'lucide-react';

const LiveMatchesTicker = ({ matches }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Flatten all live matches from all sports
  const allLiveMatches = Object.entries(matches || {}).reduce((acc, [sport, sportMatches]) => {
    if (!Array.isArray(sportMatches)) return acc;
    
    // Filter for live matches and add sport info
    const sportLiveMatches = sportMatches
      .filter(match => match.status === 'live' || match.status === 'Live' || match.status === 'LIVE')
      .map(match => ({
        ...match,
        sport,
        sportIcon: getSportIcon(sport),
        // Normalize team names for consistent display
        teams: {
          home: { 
            name: match.teams?.home?.name || match.teams?.[0]?.name || 'Team A',
            score: match.goals?.home || match.scores?.home?.total || 0
          },
          away: { 
            name: match.teams?.away?.name || match.teams?.[1]?.name || 'Team B',
            score: match.goals?.away || match.scores?.away?.total || 0  
          }
        },
        leagueName: match.league?.name || match.series || match.tournament || ''
      }));
    return [...acc, ...sportLiveMatches];
  }, []);
  
  console.log('🎯 LiveMatchesTicker processing matches:', matches);
  console.log('🎯 Found live matches:', allLiveMatches);

  useEffect(() => {
    if (!isPlaying || allLiveMatches.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allLiveMatches.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, allLiveMatches.length]);

  function getSportIcon(sport) {
    const icons = {
      cricket: '🏏',
      football: '⚽',
      basketball: '🏀',
      badminton: '🏸',
      tennis: '🎾',
      tableTennis: '🏓',
      volleyball: '🏐'
    };
    return icons[sport] || '🏆';
  }

  function formatScore(match) {
    if (match.sport === 'cricket') {
      return {
        home: `${match.scores?.home?.runs || 0}/${match.scores?.home?.wickets || 0}`,
        away: `${match.scores?.away?.runs || 0}/${match.scores?.away?.wickets || 0}`
      };
    } else if (match.sport === 'football') {
      return {
        home: match.scores?.home?.goals || 0,
        away: match.scores?.away?.goals || 0
      };
    } else if (match.sport === 'basketball') {
      return {
        home: match.scores?.home?.total || 0,
        away: match.scores?.away?.total || 0
      };
    }
    return { home: 0, away: 0 };
  }

  function getMatchStatus(match) {
    if (match.sport === 'cricket') {
      if (match.elapsed) return `${match.elapsed} overs`;
      return 'Live';
    } else if (match.sport === 'football') {
      if (match.elapsed) return `${match.elapsed}'`;
      return 'Live';
    }
    return 'Live';
  }

  if (allLiveMatches.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-3">
            <Clock className="w-5 h-5" />
            <span className="font-medium">No live matches at the moment</span>
            <span className="text-blue-200">•</span>
            <span className="text-sm">Check back soon for live updates</span>
          </div>
        </div>
      </div>
    );
  }

  const currentMatch = allLiveMatches[currentIndex];
  const scores = formatScore(currentMatch);

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white py-3 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Live Indicator */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-bold text-sm">LIVE</span>
              </div>
              <span className="text-white/70">•</span>
              <span className="text-xl">{currentMatch.sportIcon}</span>
            </div>

            {/* Match Info */}
            <div className="flex items-center space-x-6 flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center space-x-4 min-w-0">
                {/* Teams and Scores */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold truncate">
                      {currentMatch.teams?.home?.name || currentMatch.teams?.home}
                    </span>
                    <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">
                      {scores.home}
                    </span>
                  </div>
                  
                  <span className="text-white/80 font-medium">vs</span>
                  
                  <div className="flex items-center space-x-2">
                    <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">
                      {scores.away}
                    </span>
                    <span className="font-semibold truncate">
                      {currentMatch.teams?.away?.name || currentMatch.teams?.away}
                    </span>
                  </div>
                </div>

                {/* Match Status */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-white/80">•</span>
                  <span className="bg-white/10 px-2 py-1 rounded">
                    {getMatchStatus(currentMatch)}
                  </span>
                </div>

                {/* League/Tournament */}
                {currentMatch.leagueName && (
                  <>
                    <span className="text-white/80">•</span>
                    <span className="text-sm text-white/90 truncate">
                      {currentMatch.leagueName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Match Counter */}
            <div className="text-sm text-white/80">
              {currentIndex + 1} of {allLiveMatches.length}
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title={isPlaying ? 'Pause ticker' : 'Resume ticker'}
            >
              <Play 
                className={`w-4 h-4 ${isPlaying ? 'opacity-50' : 'opacity-100'}`}
                fill={isPlaying ? 'currentColor' : 'none'}
              />
            </button>

            {/* Next Button */}
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % allLiveMatches.length)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Next match"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 w-full bg-white/20 rounded-full h-1">
          <div 
            className="bg-white h-1 rounded-full transition-all duration-100 ease-linear"
            style={{ 
              width: `${((currentIndex + 1) / allLiveMatches.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveMatchesTicker;
