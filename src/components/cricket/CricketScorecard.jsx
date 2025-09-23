import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../services/firebase/firebaseClient';
import { Clock, MapPin, Trophy, TrendingUp, Users, Target, Zap } from 'lucide-react';

const CricketScorecard = ({ sport, data = [] }) => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    console.log('🏏 Cricket component received data:', data);
    
    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    // Process the API data
    const processedMatches = data.map(match => ({
      id: match.id,
      name: match.name,
      status: match.status?.toLowerCase() || 'upcoming',
      teams: {
        home: { 
          name: match.teams?.[0]?.name || 'Team A',
          shortName: match.teams?.[0]?.shortName || 'TA',
          logo: match.teams?.[0]?.img || ''
        },
        away: { 
          name: match.teams?.[1]?.name || 'Team B',
          shortName: match.teams?.[1]?.shortName || 'TB', 
          logo: match.teams?.[1]?.img || ''
        }
      },
      scores: match.scores || [],
      venue: match.venue || 'TBD',
      series: match.series || 'Unknown Series',
      isAsianMatch: match.isAsianMatch || false,
      startTime: new Date(match.date || Date.now()).getTime()
    }));

    // Sort by priority (Asian matches first) and status
    const sortedMatches = processedMatches.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      if (a.isAsianMatch && !b.isAsianMatch) return -1;
      if (b.isAsianMatch && !a.isAsianMatch) return 1;
      return b.startTime - a.startTime;
    });
    
    setMatches(sortedMatches);
    if (sortedMatches.length > 0 && !selectedMatch) {
      setSelectedMatch(sortedMatches[0]);
    }
    setLoading(false);
  }, [data, selectedMatch]);

  const getMatchesByStatus = (status) => {
    return matches.filter(match => match.status === status);
  };

  const formatOvers = (overs) => {
    if (!overs) return '0.0';
    return typeof overs === 'number' ? overs.toFixed(1) : overs;
  };

  const getRunRate = (runs, overs) => {
    if (!overs || overs === 0) return '0.00';
    return (runs / overs).toFixed(2);
  };

  const MatchCard = ({ match, isSelected, onClick }) => {
    const isLive = match.status === 'live';
    
    return (
      <div
        onClick={() => onClick(match)}
        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
          isSelected 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
        } ${isLive ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏏</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {match.matchType} • {match.seriesName}
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
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{match.teams?.home?.flag || '🏏'}</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {match.teams?.home?.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {match.scores?.home?.runs}/{match.scores?.home?.wickets}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                ({formatOvers(match.scores?.home?.overs)})
              </span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{match.teams?.away?.flag || '🏏'}</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {match.teams?.away?.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {match.scores?.away?.runs}/{match.scores?.away?.wickets}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                ({formatOvers(match.scores?.away?.overs)})
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <MapPin size={14} />
              <span>{match.venue || 'TBD'}</span>
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

  const DetailedScorecard = ({ match }) => {
    if (!match) return null;

    return (
      <div className="space-y-6">
        {/* Match Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">{match.seriesName}</h3>
              <p className="text-green-100">{match.matchType} • {match.venue}</p>
            </div>
            {match.status === 'live' && (
              <div className="flex items-center space-x-2 bg-red-500 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-semibold">LIVE</span>
              </div>
            )}
          </div>

          {/* Teams Score Display */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">{match.teams?.home?.flag}</span>
                <span className="text-xl font-bold">{match.teams?.home?.name}</span>
              </div>
              <div className="text-4xl font-bold">
                {match.scores?.home?.runs}/{match.scores?.home?.wickets}
              </div>
              <div className="text-green-200">
                ({formatOvers(match.scores?.home?.overs)} overs)
              </div>
              <div className="text-sm text-green-200 mt-1">
                RR: {getRunRate(match.scores?.home?.runs, match.scores?.home?.overs)}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">{match.teams?.away?.flag}</span>
                <span className="text-xl font-bold">{match.teams?.away?.name}</span>
              </div>
              <div className="text-4xl font-bold">
                {match.scores?.away?.runs}/{match.scores?.away?.wickets}
              </div>
              <div className="text-green-200">
                ({formatOvers(match.scores?.away?.overs)} overs)
              </div>
              <div className="text-sm text-green-200 mt-1">
                RR: {getRunRate(match.scores?.away?.runs, match.scores?.away?.overs)}
              </div>
            </div>
          </div>

          {/* Match Status */}
          {match.result && (
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold bg-white/20 rounded-lg py-2 px-4">
                {match.result}
              </p>
            </div>
          )}
        </div>

        {/* Live Data Section */}
        {match.status === 'live' && match.liveData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Batsmen */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Current Batsmen
              </h4>
              <div className="space-y-3">
                {match.liveData.currentBatsmen?.map((batsman, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{batsman.name}</span>
                      {batsman.isOnStrike && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs rounded">
                          On Strike
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {batsman.runs} ({batsman.balls})
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        SR: {batsman.strikeRate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Bowler */}
            {match.liveData.currentBowler && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Current Bowler
                </h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-lg">{match.liveData.currentBowler.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {match.liveData.currentBowler.overs} overs
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-600">{match.liveData.currentBowler.wickets}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Wickets</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{match.liveData.currentBowler.runs}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Runs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{match.liveData.currentBowler.economy}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Economy</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Commentary */}
        {match.liveData?.commentary && match.liveData.commentary.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Live Commentary
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {match.liveData.commentary.slice(0, 10).map((comment, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Toss Winner</div>
            <div className="font-semibold">{match.tossWinner || 'TBD'}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Venue</div>
            <div className="font-semibold">{match.venue}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Start Time</div>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading cricket matches...</p>
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
                ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm'
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
            <DetailedScorecard match={selectedMatch} />
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

export default CricketScorecard;
