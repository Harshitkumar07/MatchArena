import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const ApiTestPage = () => {
  const [testResults, setTestResults] = useState({
    cricket: { status: 'testing...', data: [] },
    football: { status: 'testing...', data: [] },
    basketball: { status: 'testing...', data: [] }
  });

  useEffect(() => {
    const testAPIs = async () => {
      console.log('🧪 Starting API tests...');
      
      // Clear cache first
      apiService.clearCache();
      
      // Test Cricket API
      try {
        console.log('🏏 Testing Cricket API...');
        const cricketData = await apiService.getCricketMatches();
        setTestResults(prev => ({
          ...prev,
          cricket: { status: 'success', data: cricketData }
        }));
        console.log('✅ Cricket data:', cricketData);
      } catch (error) {
        console.error('❌ Cricket API failed:', error);
        setTestResults(prev => ({
          ...prev,
          cricket: { status: 'failed', data: [], error: error.message }
        }));
      }

      // Test Football API
      try {
        console.log('⚽ Testing Football API...');
        const footballData = await apiService.getFootballMatches();
        setTestResults(prev => ({
          ...prev,
          football: { status: 'success', data: footballData }
        }));
        console.log('✅ Football data:', footballData);
      } catch (error) {
        console.error('❌ Football API failed:', error);
        setTestResults(prev => ({
          ...prev,
          football: { status: 'failed', data: [], error: error.message }
        }));
      }

      // Test Basketball API
      try {
        console.log('🏀 Testing Basketball API...');
        const basketballData = await apiService.getBasketballMatches();
        setTestResults(prev => ({
          ...prev,
          basketball: { status: 'success', data: basketballData }
        }));
        console.log('✅ Basketball data:', basketballData);
      } catch (error) {
        console.error('❌ Basketball API failed:', error);
        setTestResults(prev => ({
          ...prev,
          basketball: { status: 'failed', data: [], error: error.message }
        }));
      }
    };

    testAPIs();
  }, []);

  const renderTestResult = (sport, result) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'success': return 'text-green-600 bg-green-100';
        case 'failed': return 'text-red-600 bg-red-100';
        default: return 'text-yellow-600 bg-yellow-100';
      }
    };

    return (
      <div key={sport} className="border rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2 capitalize">{sport} API Test</h3>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.status)}`}>
          Status: {result.status}
        </div>
        
        {result.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">Error: {result.error}</p>
          </div>
        )}
        
        <div className="mt-3">
          <p className="text-sm text-gray-600">Matches found: {result.data.length}</p>
          {result.data.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Sample match:</p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(result.data[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Test Results</h1>
      <p className="text-gray-600 mb-6">Testing real API endpoints (no mock data)</p>
      
      <div className="grid gap-4">
        {Object.entries(testResults).map(([sport, result]) => 
          renderTestResult(sport, result)
        )}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
        <p className="text-sm text-gray-600">
          Check the browser console (F12) for detailed API request logs.
        </p>
      </div>
    </div>
  );
};

export default ApiTestPage;
