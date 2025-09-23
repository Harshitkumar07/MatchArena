import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../services/firebase/firebaseClient';
import { Clock, MapPin, Trophy, Users, Target, Activity, Calendar } from 'lucide-react';

const FootballMatchCenter = ({ sport, data = [] }) => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [standings, setStandings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    console.log(' Football component received data:', data);
    
    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    // Process the API data  
    const processedMatches = data.map(match => ({
      id: match.id,
      teams: match.teams,
      goals: match.goals,
      league: match.league,
      fixture: {
        ...match.fixture,
        status: { short: match.status?.short || 'NS' }
      },
      status: match.status?.short === 'FT' ? 'completed' : 
             match.status?.short === 'LIVE' ? 'live' : 'upcoming',
      isAsianLeague: match.league && isAsianLeague(match.league)
    }));

    // Sort by priority (Asian leagues first) and status
    const sortedMatches = processedMatches.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      if (a.isAsianLeague && !b.isAsianLeague) return -1;
      if (b.isAsianLeague && !a.isAsianLeague) return 1;
      return (b.fixture?.timestamp || 0) - (a.fixture?.timestamp || 0);
    });
    
    setMatches(sortedMatches);
    if (sortedMatches.length > 0 && !selectedMatch) {
      setSelectedMatch(sortedMatches[0]);
    }
    setLoading(false);
  }, [data, selectedMatch]);

  // Helper function to identify Asian leagues
  const isAsianLeague = (league) => {
    if (!league) return false;
    const asianKeywords = ['Indian Super League', 'ISL', 'J-League', 'K League', 'Chinese Super League', 'AFC', 'Asian'];
    const leagueName = league.name?.toLowerCase() || '';
    const country = league.country?.toLowerCase() || '';
    return asianKeywords.some(keyword => 
      leagueName.includes(keyword.toLowerCase()) || 
      country.includes('india') || 
      country.includes('japan') || 
      country.includes('korea') || 
      country.includes('china')
    );
  };

  const getMatchesByStatus = (status) => {
    return matches.filter(match => match.status === status);
  };

  const getLeagueStandings = (leagueId) => {
    return standings[leagueId]?.standings?.data || [];
  };

  const MatchCard = ({ match, isSelected, onClick }) => {
    const isLive = match.status === 'live';
    
    return (
      <div
        onClick={() => onClick(match)}
        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
        } ${isLive ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚽</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {match.leagueName} • {match.round}
            </span>
            {match.isAsianMatch && (
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 text-xs rounded-full">
                Asian
              </span>
            )}
          </div>
          {isLive && (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold">LIVE</span>
              {match.elapsed && (
                <span className="text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                  {match.elapsed}'
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {match.teams?.home?.logo ? (
                <img src={match.teams.home.logo} alt={match.teams.home.name} className="w-6 h-6" />
              ) : (
                <span className="text-lg">🏠</span>
              )}
              <span className="font-semibold text-gray-900 dark:text-white">
                {match.teams?.home?.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {match.scores?.home?.goals || 0}
              </span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {match.teams?.away?.logo ? (
                <img src={match.teams.away.logo} alt={match.teams.away.name} className="w-6 h-6" />
              ) : (
                <span className="text-lg">✈️</span>
              )}
              <span className="font-semibold text-gray-900 dark:text-white">
                {match.teams?.away?.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {match.scores?.away?.goals || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <MapPin size={14} />
              <span>{match.venue?.name || 'TBD'}</span>
            </div>
            {match.status === 'upcoming' && (
              <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                <Clock size={14} />
                <span>{new Date(match.startsAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DetailedMatchView = ({ match }) => {
    if (!match) return null;

    const leagueStandings = getLeagueStandings(match.leagueId);

    return (
      <div className="space-y-6">
        {/* Match Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">{match.leagueName}</h3>
              <p className="text-blue-100">{match.round} • {match.venue?.name}</p>
            </div>
            {match.status === 'live' && (
              <div className="flex items-center space-x-2 bg-red-500 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-semibold">LIVE {match.elapsed}'</span>
              </div>
            )}
          </div>

          {/* Teams Score Display */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {match.teams?.home?.logo ? (
                  <img src={match.teams.home.logo} alt={match.teams.home.name} className="w-8 h-8" />
                ) : (
                  <span className="text-2xl">🏠</span>
                )}
                <span className="text-xl font-bold">{match.teams?.home?.name}</span>
              </div>
              <div className="text-6xl font-bold">
                {match.scores?.home?.goals || 0}
              </div>
              {match.scores?.home?.halftime !== undefined && (
                <div className="text-blue-200 text-sm">
                  HT: {match.scores.home.halftime}
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {match.teams?.away?.logo ? (
                  <img src={match.teams.away.logo} alt={match.teams.away.name} className="w-8 h-8" />
                ) : (
                  <span className="text-2xl">✈️</span>
                )}
                <span className="text-xl font-bold">{match.teams?.away?.name}</span>
              </div>
              <div className="text-6xl font-bold">
                {match.scores?.away?.goals || 0}
              </div>
              {match.scores?.away?.halftime !== undefined && (
                <div className="text-blue-200 text-sm">
                  HT: {match.scores.away.halftime}
                </div>
              )}
            </div>
          </div>

          {/* Match Result */}
          {match.result && (
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold bg-white/20 rounded-lg py-2 px-4">
                {match.result}
              </p>
            </div>
          )}
        </div>

        {/* Match Events */}
        {match.events && match.events.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              Match Events
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {match.events.map((event, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm font-semibold text-blue-600 min-w-[3rem]">
                    {event.time.elapsed}'
                    {event.time.extra && `+${event.time.extra}`}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{event.player?.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {event.type} - {event.detail}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {event.team?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Statistics */}
        {match.statistics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-red-600" />
                Match Statistics
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Ball Possession', home: match.statistics.home?.ballPossession, away: match.statistics.away?.ballPossession },
                  { label: 'Total Shots', home: match.statistics.home?.totalShots, away: match.statistics.away?.totalShots },
                  { label: 'Shots on Goal', home: match.statistics.home?.shotsOnGoal, away: match.statistics.away?.shotsOnGoal },
                  { label: 'Corner Kicks', home: match.statistics.home?.cornerKicks, away: match.statistics.away?.cornerKicks },
                  { label: 'Fouls', home: match.statistics.home?.fouls, away: match.statistics.away?.fouls },
                  { label: 'Yellow Cards', home: match.statistics.home?.yellowCards, away: match.statistics.away?.yellowCards }
                ].map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-right w-16 font-semibold">{stat.home || 0}</div>
                    <div className="flex-1 text-center text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
                    <div className="text-left w-16 font-semibold">{stat.away || 0}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* League Standings Preview */}
            {leagueStandings.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                  League Table (Top 5)
                </h4>
                <div className="space-y-2">
                  {leagueStandings.slice(0, 5).map((team, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold w-6">{team.position}</span>
                        {team.team?.logo ? (
                          <img src={team.team.logo} alt={team.team.name} className="w-5 h-5" />
                        ) : (
                          <span className="w-5 h-5 bg-gray-300 rounded"></span>
                        )}
                        <span className="text-sm font-medium truncate">{team.team?.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{team.all?.played}</span>
                        <span className="font-semibold">{team.points}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Match Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Referee</div>
            <div className="font-semibold">{match.referee || 'TBD'}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Stadium</div>
            <div className="font-semibold">{match.venue?.name}</div>
            <div className="text-xs text-gray-400">{match.venue?.city}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Kick-off</div>
            <div className="font-semibold">
              {new Date(match.startsAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading football matches...</p>
        </div>
      </div>
    );
  }

  const liveMatches = getMatchesByStatus('live');
  const upcomingMatches = getMatchesByStatus('upcoming');
  const completedMatches = getMatchesByStatus('completed');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { key: 'live', label: 'Live', count: liveMatches.length },
          { key: 'upcoming', label: 'Upcoming', count: upcomingMatches.length },
          { key: 'completed', label: 'Completed', count: completedMatches.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matches List */}
        <div className="lg:col-span-1">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {getMatchesByStatus(activeTab).map(match => (
              <MatchCard
                key={match.id}
                match={match}
                isSelected={selectedMatch?.id === match.id}
                onClick={setSelectedMatch}
              />
            ))}
            {getMatchesByStatus(activeTab).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No {activeTab} matches available
              </div>
            )}
          </div>
        </div>

        {/* Match Details */}
        <div className="lg:col-span-2">
          {selectedMatch ? (
            <DetailedMatchView match={selectedMatch} />
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Select a match to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FootballMatchCenter;
