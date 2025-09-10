import React, { useState } from 'react';
import ExplorePage from './ExplorePage';

const HomePage = () => {
  const [exploring, setExploring] = useState(false);

  const handleExploreClick = () => {
    setExploring(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 text-white p-5">
      <div className="max-w-2xl text-center">
        {!exploring ? (
          <div>
            <h1 className="text-5xl font-bold text-indigo-400 transition duration-300 transform hover:scale-105">
              Welcome to Cricket Stats Arena
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              Immerse yourself in the comprehensive realm of cricket statistics, live match scores, and insightful analytics.
            </p>
            <button
              onClick={handleExploreClick}
              className="mt-10 px-8 py-4 bg-blue-600 rounded-lg text-white font-semibold shadow-lg transition duration-200 hover:bg-blue-700 transform hover:scale-105"
            >
              Begin Your Exploration
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setExploring(false)}
              className="fixed top-5 left-5 px-6 py-2 bg-gray-700 rounded-lg transition duration-200 hover:bg-gray-600 shadow-lg z-10"
            >
              Back
            </button>
            <ExplorePage />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
