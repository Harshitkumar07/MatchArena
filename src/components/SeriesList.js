import React, { useState, useEffect } from "react";

const SeriesList = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSeries = async () => {
    try {
      // Note: API calls will be moved to Firebase Functions for security
      // This is a temporary placeholder that will use the Firebase Realtime Database
      // TODO: Replace with Firebase RTDB listener for /series/cricket
      console.warn('Series data will be fetched from Firebase Realtime Database');
      setSeries([]);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  if (loading) return <p className="text-center text-lg mt-8">Loading...</p>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h2 className="text-4xl font-bold mb-6 text-center text-blue-500">Cricket Series</h2>
      {series.length === 0 ? (
        <p className="text-center text-gray-400">No series currently available.</p>
      ) : (
        series.map((s, index) => (
          <div 
            key={index} 
            className="p-5 bg-gray-800 text-white rounded-lg mb-6 shadow-xl hover:scale-105 transition-transform duration-300"
          >
            <h3 className="text-2xl font-semibold mb-3">{s.name}</h3>
            <p className="text-sm font-light mb-3">From <span className="font-semibold">{s.startDate}</span> to <span className="font-semibold">{s.endDate}</span></p>
            <div className="text-sm grid grid-cols-2 gap-3 mt-3">
              <p>ODI Matches: <span className="font-semibold">{s.odi}</span></p>
              <p>T20 Matches: <span className="font-semibold">{s.t20}</span></p>
              <p>Test Matches: <span className="font-semibold">{s.test}</span></p>
              <p>Squads: <span className="font-semibold">{s.squads}</span></p>
              <p>Total Matches: <span className="font-semibold">{s.matches}</span></p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SeriesList;
