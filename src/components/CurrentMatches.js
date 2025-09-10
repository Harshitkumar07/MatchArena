import React, { useEffect, useState } from 'react';

const CurrentMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleMatchId, setVisibleMatchId] = useState(null);

  const fetchCurrentMatches = async () => {
    try {
      // Note: API calls will be moved to Firebase Functions for security
      // This is a temporary placeholder that will use the Firebase Realtime Database
      // TODO: Replace with Firebase RTDB listener for /matches/cricket
      console.warn('Current matches will be fetched from Firebase Realtime Database');
      setMatches([]);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentMatches();
  }, []);

  const toggleScores = (id) => {
    setVisibleMatchId(visibleMatchId === id ? null : id);
  };

  if (loading) return <p className="text-center text-lg mt-8">Loading matches...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-4xl font-bold mb-6 text-center text-blue-700">Current Cricket Matches</h2>
      {matches.length === 0 ? (
        <p className="text-center text-gray-700">No matches currently available.</p>
      ) : (
        matches.map((match) => (
          <div
            key={match.id}
            onClick={() => toggleScores(match.id)}
            className="cursor-pointer p-4 bg-gray-800 text-white rounded-lg mb-4 shadow-lg transition-transform transform hover:scale-105 hover:shadow-2xl"
          >
            <h3 className="text-2xl font-semibold mb-2 text-yellow-300">{match.name}</h3>
            <p className="mb-1 text-gray-300">Match Type: <span className="font-medium">{match.matchType}</span></p>
            <p className="mb-1 text-gray-300">Status: <span className="font-medium">{match.status}</span></p>
            <p className="mb-1 text-gray-300">Venue: <span className="font-medium">{match.venue}</span></p>
            <p className="mb-1 text-gray-300">Date: <span className="font-medium">{match.date}</span></p>
            <p className="mb-1 text-gray-300">Teams: <span className="font-medium">{match.teams.join(' vs ')}</span></p>
            {visibleMatchId === match.id && (
              <div className="mt-4 p-3 bg-gray-700 rounded-md">
                <h4 className="text-xl font-semibold text-blue-300 mb-2">Scores</h4>
                {match.score.map((score, idx) => (
                  <p key={idx} className="text-gray-200">
                    {score.inning}: {score.runs} runs, {score.wickets} wickets, {score.overs} overs
                  </p>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default CurrentMatches;
