import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCricketData } from '../services/api/sports/cricketApi';
import MatchCard from './MatchCard';

const LiveTicker = ({ sport = 'cricket', maxItems = 5 }) => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        const data = await fetchCricketData();
        setLiveMatches(data.live || []);
      } catch (error) {
        console.error('Error loading live matches:', error);
        setLiveMatches([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadMatches();
    const interval = setInterval(loadMatches, 60000);
    return () => clearInterval(interval);
  }, [sport]);

  const items = liveMatches.slice(0, maxItems);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold">Live now</span>
          <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-red-500" />
        </div>
        <div className="text-xs text-gray-500">
          <Link to={`/sport/${sport}`} className="text-blue-500 hover:underline">
            View all
          </Link>
        </div>
      </div>
      <div className="p-3 divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="py-6 text-center text-sm text-gray-500">Loading live matches…</div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">No live matches right now</div>
        ) : (
          items.map((m) => <MatchCard key={m.id || m.key} match={m} compact />)
        )}
      </div>
    </div>
  );
};

export default LiveTicker;
