import React, { useState, useEffect } from 'react';

const CricScores = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCricScores();
  }, []);

  const fetchCricScores = async () => {
    // Note: API calls will be moved to Firebase Functions for security
    // This is a temporary placeholder that will use the Firebase Realtime Database
    try {
      // TODO: Replace with Firebase RTDB listener for /matches/cricket
      console.warn('Cricket scores will be fetched from Firebase Realtime Database');
      setScores([]);
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading scores...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Live Cricket Scores</h2>
      {scores.map((match) => (
        <div
          key={match.id}
          className="p-4 bg-gray-800 rounded-lg mb-4 flex flex-col items-start hover:scale-105 transition-all duration-300 ease-in-out"
        >
          <h3 className="text-xl font-semibold mb-2">{match.series}</h3>
          <div className="flex items-center mb-2">
            <img src={match.t1img} alt={match.t1} className="w-12 h-12 rounded-full mr-4" />
            <span className="text-lg font-bold">{match.t1}</span>
            <span className="ml-2 text-gray-400">{match.t1s}</span>
          </div>
          <div className="flex items-center mb-2">
            <img src={match.t2img} alt={match.t2} className="w-12 h-12 rounded-full mr-4" />
            <span className="text-lg font-bold">{match.t2}</span>
            <span className="ml-2 text-gray-400">{match.t2s}</span>
          </div>
          <p className="mt-2 text-yellow-400 font-semibold">Status: {match.status}</p>
          <p className="text-gray-500">Match Type: {match.matchType.toUpperCase()}</p>
        </div>
      ))}
    </div>
  );
};

export default CricScores;
