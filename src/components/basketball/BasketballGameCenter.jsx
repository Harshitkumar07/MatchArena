import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../services/firebase/firebaseClient';
import { Clock, MapPin, Trophy, Users, Target, Activity, BarChart3 } from 'lucide-react';

const BasketballGameCenter = ({ sport, data = [] }) => {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    console.log('🏀 Basketball component received data:', data);
    
    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    // Process the API data
    const processedGames = data.map(game => ({
      id: game.id,
      teams: game.teams,
      scores: game.scores,
      status: game.status || 'upcoming',
      league: game.league,
      date: game.date || Date.now(),
      venue: game.venue || 'TBD',
      isAsianMatch: game.isAsianMatch || false
    }));

    // Sort by priority (Asian leagues first) and status
    const sortedGames = processedGames.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      if (a.isAsianMatch && !b.isAsianMatch) return -1;
      if (b.isAsianMatch && !a.isAsianMatch) return 1;
      return b.date - a.date;
    });
    
    setGames(sortedGames);
    if (sortedGames.length > 0 && !selectedGame) {
      setSelectedGame(sortedGames[0]);
    }
    setLoading(false);
  }, [data, selectedGame]);

  const getGamesByStatus = (status) => {
    return games.filter(game => game.status === status);
  };

  const GameCard = ({ game, isSelected, onClick }) => {
    const isLive = game.status === 'live';
    
    return (
      <div
        onClick={() => onClick(game)}
        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
          isSelected 
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
        } ${isLive ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏀</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {game.league?.name} • {game.league?.season}
            </span>
            {game.isAsianMatch && (
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 text-xs rounded-full">
                Asian
              </span>
            )}
          </div>
          {isLive && (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold">LIVE</span>
              {game.time && (
                <span className="text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                  {game.time}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {game.teams?.home?.logo ? (
                <img src={game.teams.home.logo} alt={game.teams.home.name} className="w-6 h-6" />
              ) : (
                <span className="text-lg">🏠</span>
              )}
              <span className="font-semibold text-gray-900 dark:text-white">
                {game.teams?.home?.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {game.scores?.home?.total || 0}
              </span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {game.teams?.away?.logo ? (
                <img src={game.teams.away.logo} alt={game.teams.away.name} className="w-6 h-6" />
              ) : (
                <span className="text-lg">✈️</span>
              )}
              <span className="font-semibold text-gray-900 dark:text-white">
                {game.teams?.away?.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {game.scores?.away?.total || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <MapPin size={14} />
              <span>{game.venue || 'TBD'}</span>
            </div>
            {game.status === 'upcoming' && (
              <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                <Clock size={14} />
                <span>{new Date(game.date).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DetailedGameView = ({ game }) => {
    if (!game) return null;

    return (
      <div className="space-y-6">
        {/* Game Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">{game.league?.name}</h3>
              <p className="text-orange-100">Season {game.league?.season} • {game.venue}</p>
            </div>
            {game.status === 'live' && (
              <div className="flex items-center space-x-2 bg-red-500 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-semibold">LIVE</span>
                {game.time && <span>{game.time}</span>}
              </div>
            )}
          </div>

          {/* Teams Score Display */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {game.teams?.home?.logo ? (
                  <img src={game.teams.home.logo} alt={game.teams.home.name} className="w-8 h-8" />
                ) : (
                  <span className="text-2xl">🏠</span>
                )}
                <span className="text-xl font-bold">{game.teams?.home?.name}</span>
              </div>
              <div className="text-6xl font-bold">
                {game.scores?.home?.total || 0}
              </div>
              {/* Quarter Scores */}
              <div className="flex justify-center space-x-2 mt-2 text-sm text-orange-200">
                <span>Q1: {game.scores?.home?.quarter_1 || 0}</span>
                <span>Q2: {game.scores?.home?.quarter_2 || 0}</span>
                <span>Q3: {game.scores?.home?.quarter_3 || 0}</span>
                <span>Q4: {game.scores?.home?.quarter_4 || 0}</span>
                {game.scores?.home?.over_time && (
                  <span>OT: {game.scores.home.over_time}</span>
                )}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {game.teams?.away?.logo ? (
                  <img src={game.teams.away.logo} alt={game.teams.away.name} className="w-8 h-8" />
                ) : (
                  <span className="text-2xl">✈️</span>
                )}
                <span className="text-xl font-bold">{game.teams?.away?.name}</span>
              </div>
              <div className="text-6xl font-bold">
                {game.scores?.away?.total || 0}
              </div>
              {/* Quarter Scores */}
              <div className="flex justify-center space-x-2 mt-2 text-sm text-orange-200">
                <span>Q1: {game.scores?.away?.quarter_1 || 0}</span>
                <span>Q2: {game.scores?.away?.quarter_2 || 0}</span>
                <span>Q3: {game.scores?.away?.quarter_3 || 0}</span>
                <span>Q4: {game.scores?.away?.quarter_4 || 0}</span>
                {game.scores?.away?.over_time && (
                  <span>OT: {game.scores.away.over_time}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quarter Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
            Quarter Breakdown
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Team</th>
                  <th className="text-center py-2">Q1</th>
                  <th className="text-center py-2">Q2</th>
                  <th className="text-center py-2">Q3</th>
                  <th className="text-center py-2">Q4</th>
                  {(game.scores?.home?.over_time || game.scores?.away?.over_time) && (
                    <th className="text-center py-2">OT</th>
                  )}
                  <th className="text-center py-2 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 font-medium">{game.teams?.home?.name}</td>
                  <td className="text-center py-3">{game.scores?.home?.quarter_1 || 0}</td>
                  <td className="text-center py-3">{game.scores?.home?.quarter_2 || 0}</td>
                  <td className="text-center py-3">{game.scores?.home?.quarter_3 || 0}</td>
                  <td className="text-center py-3">{game.scores?.home?.quarter_4 || 0}</td>
                  {(game.scores?.home?.over_time || game.scores?.away?.over_time) && (
                    <td className="text-center py-3">{game.scores?.home?.over_time || 0}</td>
                  )}
                  <td className="text-center py-3 font-bold text-lg">{game.scores?.home?.total || 0}</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">{game.teams?.away?.name}</td>
                  <td className="text-center py-3">{game.scores?.away?.quarter_1 || 0}</td>
                  <td className="text-center py-3">{game.scores?.away?.quarter_2 || 0}</td>
                  <td className="text-center py-3">{game.scores?.away?.quarter_3 || 0}</td>
                  <td className="text-center py-3">{game.scores?.away?.quarter_4 || 0}</td>
                  {(game.scores?.home?.over_time || game.scores?.away?.over_time) && (
                    <td className="text-center py-3">{game.scores?.away?.over_time || 0}</td>
                  )}
                  <td className="text-center py-3 font-bold text-lg">{game.scores?.away?.total || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Asian Basketball Leagues Info */}
        {game.isAsianMatch && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <h4 className="text-lg font-semibold mb-3 flex items-center text-red-700 dark:text-red-300">
              <Trophy className="w-5 h-5 mr-2" />
              Asian Basketball League
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">League Information</h5>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• {game.league?.name} is one of Asia's premier basketball leagues</li>
                  <li>• Features top talent from across the continent</li>
                  <li>• Known for fast-paced, high-scoring games</li>
                  <li>• Strong fan following in {game.country || 'the region'}</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Popular Teams</h5>
                <div className="flex flex-wrap gap-2">
                  {['Beijing Ducks', 'Guangdong Tigers', 'Shanghai Sharks', 'Liaoning Leopards'].map((team, index) => (
                    <span key={index} className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs rounded">
                      {team}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">League</div>
            <div className="font-semibold">{game.league?.name}</div>
            <div className="text-xs text-gray-400">Season {game.league?.season}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Venue</div>
            <div className="font-semibold">{game.venue || 'TBD'}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Game Time</div>
            <div className="font-semibold">
              {new Date(game.date).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Mock Player Stats for Asian leagues */}
        {game.isAsianMatch && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Top Performers (Mock Data)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold mb-3">{game.teams?.home?.name}</h5>
                <div className="space-y-2">
                  {[
                    { name: 'Yi Jianlian', points: 28, rebounds: 12, assists: 4 },
                    { name: 'Zhou Qi', points: 18, rebounds: 8, assists: 2 },
                    { name: 'Guo Ailun', points: 15, rebounds: 3, assists: 9 }
                  ].map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="font-medium">{player.name}</span>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {player.points}pts, {player.rebounds}reb, {player.assists}ast
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="font-semibold mb-3">{game.teams?.away?.name}</h5>
                <div className="space-y-2">
                  {[
                    { name: 'Stephon Marbury', points: 32, rebounds: 6, assists: 8 },
                    { name: 'Jimmer Fredette', points: 24, rebounds: 4, assists: 5 },
                    { name: 'Brandon Bass', points: 16, rebounds: 10, assists: 2 }
                  ].map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="font-medium">{player.name}</span>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {player.points}pts, {player.rebounds}reb, {player.assists}ast
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading basketball games...</p>
        </div>
      </div>
    );
  }

  const liveGames = getGamesByStatus('live');
  const upcomingGames = getGamesByStatus('upcoming');
  const completedGames = getGamesByStatus('completed');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { key: 'live', label: 'Live', count: liveGames.length },
          { key: 'upcoming', label: 'Upcoming', count: upcomingGames.length },
          { key: 'completed', label: 'Completed', count: completedGames.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Games List */}
        <div className="lg:col-span-1">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {getGamesByStatus(activeTab).map(game => (
              <GameCard
                key={game.id}
                game={game}
                isSelected={selectedGame?.id === game.id}
                onClick={setSelectedGame}
              />
            ))}
            {getGamesByStatus(activeTab).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No {activeTab} games available
              </div>
            )}
          </div>
        </div>

        {/* Game Details */}
        <div className="lg:col-span-2">
          {selectedGame ? (
            <DetailedGameView game={selectedGame} />
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Select a game to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasketballGameCenter;
