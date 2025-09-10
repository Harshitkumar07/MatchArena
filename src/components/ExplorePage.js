import React, { useState } from 'react';
import CricScores from './CricScores';
import CurrentMatches from './CurrentMatches';
import SeriesList from './SeriesList';

const ExplorePage = () => {
  const [currentView, setCurrentView] = useState(null);

  const handleButtonClick = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen p-5 text-white flex flex-col items-center">
      <button
        onClick={() => setCurrentView(null)}
        className="fixed top-5 left-5 px-6 py-2 bg-gray-700 rounded-lg transition duration-200 hover:bg-gray-600 shadow-lg z-10"
        style={{ display: currentView ? 'block' : 'none' }} // Hides the back button when on explore page
      >
        Back
      </button>


      {!currentView ? (
        <div className="text-center">
          <h2 className="text-4xl font-bold text-indigo-400 mb-4">Explore Cricket Data</h2>
          <p className="mt-2 text-lg text-gray-300">Select an option to get started:</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
            {['scores', 'Matches', 'series'].map((view, index) => (
              <div
                key={index}
                className="bg-gray-900 p-5 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
              >
                <h3 className="text-2xl font-semibold text-indigo-500 mb-2">
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </h3>
                <p className="mt-2 text-gray-400">{`Explore ${view.replace(/([A-Z])/g, ' $1').toLowerCase()}.`}</p>
                <button
                  onClick={() => handleButtonClick(view)}
                  className={`mt-4 px-6 py-3 ${view === 'scores' ? 'bg-green-600' : view === 'currentMatches' ? 'bg-red-600' : 'bg-blue-600'} rounded-lg text-white transition duration-200 hover:${view === 'scores' ? 'bg-green-700' : view === 'currentMatches' ? 'bg-red-700' : 'bg-blue-700'} w-full`}
                >
                  View {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {currentView === 'scores' && <CricScores />}
          {currentView === 'Matches' && <CurrentMatches />}
          {currentView === 'series' && <SeriesList />}
        </>
      )}
    </div>
  );
};

export default ExplorePage;
