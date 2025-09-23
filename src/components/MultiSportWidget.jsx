import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../services/firebase/firebaseClient';
import { Clock, MapPin, Trophy, Users, Star, Award, Target } from 'lucide-react';

const MultiSportWidget = ({ sport, data = [] }) => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

  const sportConfig = {
    badminton: {
      name: 'Badminton',
      icon: '🏸',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      tournaments: ['BWF World Tour', 'All England', 'Indonesia Open', 'Malaysia Open', 'China Open'],
      scoreFormat: 'games',
      popularPlayers: ['Viktor Axelsen', 'Tai Tzu-ying', 'Kento Momota', 'Carolina Marin']
    },
    tennis: {
      name: 'Tennis',
      icon: '🎾',
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      tournaments: ['ATP Shanghai', 'WTA Beijing', 'Japan Open', 'Korea Open', 'Indian Wells'],
      scoreFormat: 'sets',
      popularPlayers: ['Novak Djokovic', 'Carlos Alcaraz', 'Iga Swiatek', 'Aryna Sabalenka']
    },
    tableTennis: {
      name: 'Table Tennis',
      icon: '🏓',
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      tournaments: ['WTT China Smash', 'Asian Games', 'Japan Open', 'Korea Open', 'Singapore Smash'],
      scoreFormat: 'games',
      popularPlayers: ['Fan Zhendong', 'Ma Long', 'Chen Meng', 'Sun Yingsha']
    },
    volleyball: {
      name: 'Volleyball',
      icon: '🏐',
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      tournaments: ['V.League', 'KOVO', 'Asian Games', 'Chinese League', 'Thai League'],
      scoreFormat: 'sets',
      popularPlayers: ['Yuji Nishida', 'Kim Yeon-koung', 'Zhu Ting', 'Earvin N\'Gapeth']
    }
  };

  const config = sportConfig[sport] || sportConfig.badminton;

  useEffect(() => {
    console.log(`${config.icon} ${config.name} component received data:`, data);
    
    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    // Process the API data
    const processedMatches = data.map(match => ({
      id: match.id,
      players: match.players,
      tournament: match.tournament,
      venue: match.venue,
      status: match.status || 'upcoming',
      startsAt: match.startsAt || Date.now(),
      isAsianTournament: match.isAsianTournament || false,
      sport: match.sport || sport,
      scores: match.scores || {}
    }));

    // Sort by priority (Asian tournaments first) and status
    const sortedMatches = processedMatches.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      if (a.isAsianTournament && !b.isAsianTournament) return -1;
      if (b.isAsianTournament && !a.isAsianTournament) return 1;
      return b.startsAt - a.startsAt;
    });
    
    setMatches(sortedMatches);
    if (sortedMatches.length > 0 && !selectedMatch) {
      setSelectedMatch(sortedMatches[0]);
    }
    setLoading(false);
  }, [sport, data, selectedMatch]);

  const getMatchesByStatus = (status) => {
    return matches.filter(match => match.status === status);
  };

  const formatScore = (match) => {
    if (config.scoreFormat === 'games') {
      return {
        player1: match.scores?.games?.map(game => game.player1).join(', ') || '0',
        player2: match.scores?.games?.map(game => game.player2).join(', ') || '0'
      };
    } else if (config.scoreFormat === 'sets') {
      return {
        player1: match.scores?.sets?.map(set => set.player1).join('-') || '0',
        player2: match.scores?.sets?.map(set => set.player2).join('-') || '0'
      };
    }
    return { player1: '0', player2: '0' };
  };

  const MatchCard = ({ match, isSelected, onClick }) => {
    const isLive = match.status === 'live';
    const scores = formatScore(match);
    
    return (
      <div
        onClick={() => onClick(match)}
        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
          isSelected 
            ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-900/20` 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        } ${isLive ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{config.icon}</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {match.tournament} • {match.category || match.round}
            </span>
            {match.isAsianTournament && (
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
          {/* Player 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{match.players?.player1?.flag || '🏆'}</span>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {match.players?.player1?.name}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {match.players?.player1?.country} • Rank #{match.players?.player1?.ranking}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {scores.player1}
              </span>
            </div>
          </div>

          {/* Player 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{match.players?.player2?.flag || '🏆'}</span>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {match.players?.player2?.name}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {match.players?.player2?.country} • Rank #{match.players?.player2?.ranking}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {scores.player2}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <MapPin size={14} />
              <span>{match.venue}</span>
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

    const scores = formatScore(match);

    return (
      <div className="space-y-6">
        {/* Match Header */}
        <div className={`bg-gradient-to-r ${config.gradient} text-white rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">{match.tournament}</h3>
              <p className={`text-${config.color}-100`}>{match.category || match.round} • {match.venue}</p>
            </div>
            {match.status === 'live' && (
              <div className="flex items-center space-x-2 bg-red-500 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-semibold">LIVE</span>
              </div>
            )}
          </div>

          {/* Players Display */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">{match.players?.player1?.flag}</span>
                <span className="text-xl font-bold">{match.players?.player1?.name}</span>
              </div>
              <div className="text-sm text-white/80 mb-2">
                {match.players?.player1?.country} • Rank #{match.players?.player1?.ranking}
              </div>
              <div className="text-4xl font-bold">
                {scores.player1}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">{match.players?.player2?.flag}</span>
                <span className="text-xl font-bold">{match.players?.player2?.name}</span>
              </div>
              <div className="text-sm text-white/80 mb-2">
                {match.players?.player2?.country} • Rank #{match.players?.player2?.ranking}
              </div>
              <div className="text-4xl font-bold">
                {scores.player2}
              </div>
            </div>
          </div>

          {/* Match Result */}
          {match.status === 'completed' && (
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold bg-white/20 rounded-lg py-2 px-4">
                {match.players?.player1?.name} wins in {match.scores?.games?.length || match.scores?.sets?.length} {config.scoreFormat}
              </p>
            </div>
          )}
        </div>

        {/* Score Breakdown */}
        {match.scores && (config.scoreFormat === 'games' ? match.scores.games : match.scores.sets) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Target className={`w-5 h-5 mr-2 text-${config.color}-600`} />
              {config.scoreFormat === 'games' ? 'Game' : 'Set'} Breakdown
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2">Player</th>
                    {(config.scoreFormat === 'games' ? match.scores.games : match.scores.sets).map((_, index) => (
                      <th key={index} className="text-center py-2">
                        {config.scoreFormat === 'games' ? `Game ${index + 1}` : `Set ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 font-medium">{match.players?.player1?.name}</td>
                    {(config.scoreFormat === 'games' ? match.scores.games : match.scores.sets).map((score, index) => (
                      <td key={index} className="text-center py-3 font-semibold">
                        {score.player1}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">{match.players?.player2?.name}</td>
                    {(config.scoreFormat === 'games' ? match.scores.games : match.scores.sets).map((score, index) => (
                      <td key={index} className="text-center py-3 font-semibold">
                        {score.player2}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Asian Tournament Info */}
        {match.isAsianTournament && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
            <h4 className="text-lg font-semibold mb-3 flex items-center text-orange-700 dark:text-orange-300">
              <Award className="w-5 h-5 mr-2" />
              Asian {config.name} Tournament
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Tournament Highlights</h5>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Premier {config.name.toLowerCase()} tournament in Asia</li>
                  <li>• Features world's top-ranked players</li>
                  <li>• High prize money and ranking points</li>
                  <li>• Broadcast across Asian markets</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Popular Players</h5>
                <div className="flex flex-wrap gap-2">
                  {config.popularPlayers.map((player, index) => (
                    <span key={index} className={`px-2 py-1 bg-${config.color}-100 dark:bg-${config.color}-900 text-${config.color}-700 dark:text-${config.color}-300 text-xs rounded`}>
                      {player}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Trophy className={`w-8 h-8 mx-auto mb-2 text-${config.color}-600`} />
            <div className="text-sm text-gray-500 dark:text-gray-400">Tournament</div>
            <div className="font-semibold">{match.tournament}</div>
            <div className="text-xs text-gray-400">{match.category || match.round}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Venue</div>
            <div className="font-semibold">{match.venue}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Match Time</div>
            <div className="font-semibold">
              {new Date(match.startsAt || Date.now()).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Player Rankings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-600" />
            Player Rankings & Stats
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="font-semibold mb-2">{match.players?.player1?.name}</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>World Ranking:</span>
                  <span className="font-semibold">#{match.players?.player1?.ranking}</span>
                </div>
                <div className="flex justify-between">
                  <span>Country:</span>
                  <span className="font-semibold">{match.players?.player1?.country}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recent Form:</span>
                  <span className="font-semibold text-green-600">W-W-L-W-W</span>
                </div>
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="font-semibold mb-2">{match.players?.player2?.name}</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>World Ranking:</span>
                  <span className="font-semibold">#{match.players?.player2?.ranking}</span>
                </div>
                <div className="flex justify-between">
                  <span>Country:</span>
                  <span className="font-semibold">{match.players?.player2?.country}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recent Form:</span>
                  <span className="font-semibold text-green-600">W-L-W-W-L</span>
                </div>
              </div>
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
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${config.color}-500 mx-auto mb-4`}></div>
          <p className="text-gray-600 dark:text-gray-300">Loading {config.name.toLowerCase()} matches...</p>
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
                ? `bg-white dark:bg-gray-800 text-${config.color}-600 shadow-sm`
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

export default MultiSportWidget;
