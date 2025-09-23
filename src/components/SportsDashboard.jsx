import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../services/firebase/firebaseClient';
import { Trophy, Clock, Users, Star, Activity, TrendingUp } from 'lucide-react';
import CricketScorecard from './cricket/CricketScorecard';
import FootballMatchCenter from './football/FootballMatchCenter';
import BasketballGameCenter from './basketball/BasketballGameCenter';
import MultiSportWidget from './MultiSportWidget';
import LiveMatchesTicker from './LiveMatchesTicker';
import RealTimeNotifications from './RealTimeNotifications';
import { useLiveMatches, useConnectionStatus } from '../hooks/useRealTimeUpdates';
import apiService from '../services/apiService';

const SportsDashboard = () => {
  const [selectedSport, setSelectedSport] = useState('cricket');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLiveMatches: 0,
    totalUpcoming: 0,
    popularSports: []
  });

  // Use real-time hooks
  const { liveMatches: realTimeLiveMatches, loading: liveLoading } = useLiveMatches();
  const { status: connectionStatus } = useConnectionStatus();
  
  // API data state
  const [apiData, setApiData] = useState({
    cricket: [],
    football: [],
    basketball: [],
    badminton: [],
    tennis: [],
    tableTennis: [],
    volleyball: []
  });

  // Asian-focused sports configuration
  const sportsConfig = {
    cricket: {
      name: 'Cricket',
      icon: '🏏',
      color: 'bg-green-500',
      gradient: 'from-green-400 to-green-600',
      leagues: ['IPL', 'Asia Cup', 'T20 World Cup', 'Test Series'],
      component: CricketScorecard
    },
    football: {
      name: 'Football',
      icon: '⚽',
      color: 'bg-blue-500',
      gradient: 'from-blue-400 to-blue-600',
      leagues: ['ISL', 'AFC Champions League', 'Asian Cup', 'J-League'],
      component: FootballMatchCenter
    },
    basketball: {
      name: 'Basketball',
      icon: '🏀',
      color: 'bg-orange-500',
      gradient: 'from-orange-400 to-orange-600',
      leagues: ['CBA', 'B.League', 'KBL', 'PBA'],
      component: BasketballGameCenter
    },
    badminton: {
      name: 'Badminton',
      icon: '🏸',
      color: 'bg-purple-500',
      gradient: 'from-purple-400 to-purple-600',
      leagues: ['BWF World Tour', 'All England', 'Indonesia Open', 'Malaysia Open'],
      component: MultiSportWidget
    },
    tennis: {
      name: 'Tennis',
      icon: '🎾',
      color: 'bg-yellow-500',
      gradient: 'from-yellow-400 to-yellow-600',
      leagues: ['ATP Shanghai', 'WTA Beijing', 'Japan Open', 'Korea Open'],
      component: MultiSportWidget
    },
    tableTennis: {
      name: 'Table Tennis',
      icon: '🏓',
      color: 'bg-red-500',
      gradient: 'from-red-400 to-red-600',
      leagues: ['WTT China Smash', 'Asian Games', 'Japan Open', 'Korea Open'],
      component: MultiSportWidget
    },
    volleyball: {
      name: 'Volleyball',
      icon: '🏐',
      color: 'bg-indigo-500',
      gradient: 'from-indigo-400 to-indigo-600',
      leagues: ['V.League', 'KOVO', 'Asian Games', 'Chinese League'],
      component: MultiSportWidget
    }
  };

  useEffect(() => {
    const fetchAPIData = async () => {
      setLoading(true);
      console.log('🔄 Fetching real API data...');
      
      try {
        // Fetch data from all APIs in parallel
        const [cricketMatches, footballMatches, basketballMatches] = await Promise.allSettled([
          apiService.getCricketMatches(),
          apiService.getFootballMatches(), 
          apiService.getBasketballMatches()
        ]);

        // Fetch multi-sport data
        const [badmintonMatches, tennisMatches, tableTennisMatches, volleyballMatches] = await Promise.allSettled([
          apiService.getMultiSportMatches('badminton'),
          apiService.getMultiSportMatches('tennis'),
          apiService.getMultiSportMatches('tableTennis'),
          apiService.getMultiSportMatches('volleyball')
        ]);

        // Process results
        const newApiData = {
          cricket: cricketMatches.status === 'fulfilled' ? cricketMatches.value : [],
          football: footballMatches.status === 'fulfilled' ? footballMatches.value : [],
          basketball: basketballMatches.status === 'fulfilled' ? basketballMatches.value : [],
          badminton: badmintonMatches.status === 'fulfilled' ? badmintonMatches.value : [],
          tennis: tennisMatches.status === 'fulfilled' ? tennisMatches.value : [],
          tableTennis: tableTennisMatches.status === 'fulfilled' ? tableTennisMatches.value : [],
          volleyball: volleyballMatches.status === 'fulfilled' ? volleyballMatches.value : []
        };

        setApiData(newApiData);

        // Calculate stats
        const allMatches = Object.values(newApiData).flat();
        const liveMatches = allMatches.filter(m => m.status === 'live' || m.status === 'Live');
        const upcomingMatches = allMatches.filter(m => m.status === 'upcoming' || m.status === 'Upcoming');

        setStats({
          totalLiveMatches: liveMatches.length,
          totalUpcoming: upcomingMatches.length,
          popularSports: Object.keys(sportsConfig)
        });

        console.log('✅ API data loaded:', {
          cricket: newApiData.cricket.length,
          football: newApiData.football.length,
          basketball: newApiData.basketball.length,
          total: allMatches.length
        });

      } catch (error) {
        console.error('❌ Failed to fetch API data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAPIData();
    
    // Set up polling for live updates every 2 minutes
    const interval = setInterval(fetchAPIData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const SportCard = ({ sportKey, config, isActive, onClick }) => {
    const liveCount = liveMatches[sportKey]?.length || 0;
    
    return (
      <div
        onClick={() => onClick(sportKey)}
        className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
          isActive 
            ? `bg-gradient-to-r ${config.gradient} text-white shadow-2xl` 
            : 'bg-white dark:bg-gray-800 hover:shadow-lg border border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {config.name}
                </h3>
                <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  {config.leagues[0]} • {config.leagues[1]}
                </p>
              </div>
            </div>
            {liveCount > 0 && (
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
              }`}>
                {liveCount} LIVE
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className={isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>
              Popular in Asia
            </span>
            <div className="flex items-center space-x-2">
              <Users size={16} className={isActive ? 'text-white/80' : 'text-gray-400'} />
              <span className={isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}>
                {Math.floor(Math.random() * 1000)}K
              </span>
            </div>
          </div>
        </div>
        
        {isActive && (
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
        )}
      </div>
    );
  };

  const StatsCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Sports Dashboard...</p>
        </div>
      </div>
    );
  }

  const SelectedComponent = sportsConfig[selectedSport].component;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                MatchArena Sports Center
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Live scores and updates from across Asia's premier sports leagues
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${
                connectionStatus === 'connected' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {connectionStatus === 'connected' ? 'Live Updates' : 'Offline'}
                </span>
              </div>
              <RealTimeNotifications />
            </div>
          </div>
        </div>
      </div>

      {/* Live Matches Ticker */}
      <LiveMatchesTicker matches={apiData} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={Trophy}
            title="Live Matches"
            value={stats.totalLiveMatches}
            subtitle="Happening now"
            color="bg-red-500"
          />
          <StatsCard
            icon={Clock}
            title="Upcoming Today"
            value={stats.totalUpcoming}
            subtitle="Next 24 hours"
            color="bg-blue-500"
          />
          <StatsCard
            icon={TrendingUp}
            title="Active Sports"
            value={Object.keys(sportsConfig).length}
            subtitle="Available now"
            color="bg-green-500"
          />
          <StatsCard
            icon={Users}
            title="Total Viewers"
            value="2.4M"
            subtitle="Watching live"
            color="bg-purple-500"
          />
        </div>

        {/* Sports Selection Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Select Your Sport
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(sportsConfig).map(([sportKey, config]) => (
              <SportCard
                key={sportKey}
                sportKey={sportKey}
                config={config}
                isActive={selectedSport === sportKey}
                onClick={setSelectedSport}
              />
            ))}
          </div>
        </div>

        {/* Selected Sport Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{sportsConfig[selectedSport].icon}</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {sportsConfig[selectedSport].name} Center
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Latest matches, scores, and updates from top Asian leagues
            </p>
          </div>
          
          <div className="p-6">
            <SelectedComponent sport={selectedSport} data={apiData[selectedSport]} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsDashboard;
