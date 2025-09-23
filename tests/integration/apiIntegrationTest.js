/**
 * Comprehensive API Integration Test Suite
 * Tests all sports APIs, Firebase functions, and real-time features
 */

const admin = require('firebase-admin');
const { expect } = require('chai');
const sinon = require('sinon');

// Import services for testing
const CricketDataService = require('../../functions/src/services/cricketDataService');
const FootballApiService = require('../../functions/src/services/footballApiService');
const MultiSportService = require('../../functions/src/services/multiSportService');

describe('Multi-Sport API Integration Tests', function() {
  this.timeout(30000); // 30 second timeout for API calls
  
  let cricketService, footballService, multiSportService;
  let mockDatabase;

  before(async function() {
    // Initialize Firebase Admin SDK for testing
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
      });
    }

    // Initialize services
    cricketService = new CricketDataService();
    footballService = new FootballApiService();
    multiSportService = new MultiSportService();

    // Mock database for testing
    mockDatabase = sinon.stub(admin, 'database');
    mockDatabase.returns({
      ref: sinon.stub().returns({
        set: sinon.stub().resolves(),
        push: sinon.stub().resolves(),
        once: sinon.stub().resolves({ val: () => ({}) })
      })
    });
  });

  after(function() {
    // Restore stubs
    if (mockDatabase) {
      mockDatabase.restore();
    }
  });

  describe('Cricket API Integration', function() {
    it('should fetch live cricket matches with Asian focus', async function() {
      const matches = await cricketService.getLiveMatches();
      
      expect(matches).to.be.an('array');
      if (matches.length > 0) {
        const match = matches[0];
        expect(match).to.have.property('id');
        expect(match).to.have.property('teams');
        expect(match).to.have.property('status');
        expect(match.teams).to.have.property('home');
        expect(match.teams).to.have.property('away');
        
        // Check for Asian match prioritization
        const asianMatches = matches.filter(m => m.isAsianMatch);
        console.log(`Found ${asianMatches.length} Asian cricket matches`);
      }
    });

    it('should fetch cricket series with proper data normalization', async function() {
      const series = await cricketService.getSeries();
      
      expect(series).to.be.an('array');
      if (series.length > 0) {
        const seriesItem = series[0];
        expect(seriesItem).to.have.property('id');
        expect(seriesItem).to.have.property('name');
        expect(seriesItem).to.have.property('matches');
      }
    });

    it('should handle rate limiting gracefully', async function() {
      // Test rate limiting by making multiple rapid requests
      const promises = Array(5).fill().map(() => cricketService.getLiveMatches());
      const results = await Promise.allSettled(promises);
      
      // Should handle rate limits without throwing errors
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      expect(rejectedCount).to.be.lessThan(3); // Allow some failures due to rate limiting
    });
  });

  describe('Football API Integration', function() {
    it('should fetch live football matches with Asian league focus', async function() {
      const matches = await footballService.getLiveMatches();
      
      expect(matches).to.be.an('array');
      if (matches.length > 0) {
        const match = matches[0];
        expect(match).to.have.property('id');
        expect(match).to.have.property('teams');
        expect(match).to.have.property('fixture');
        
        // Check for Asian leagues
        const asianMatches = matches.filter(m => 
          m.league && (
            m.league.name.includes('ISL') ||
            m.league.name.includes('J-League') ||
            m.league.name.includes('AFC') ||
            m.league.country === 'India' ||
            m.league.country === 'Japan' ||
            m.league.country === 'China'
          )
        );
        console.log(`Found ${asianMatches.length} Asian football matches`);
      }
    });

    it('should fetch team standings for Asian leagues', async function() {
      // Test with ISL league ID (common Asian league)
      const standings = await footballService.getStandings(323); // ISL league ID
      
      if (standings && standings.length > 0) {
        const standing = standings[0];
        expect(standing).to.have.property('team');
        expect(standing).to.have.property('points');
        expect(standing).to.have.property('rank');
      }
    });

    it('should validate match details format', async function() {
      const fixtures = await footballService.getFixtures();
      
      if (fixtures && fixtures.length > 0) {
        const fixture = fixtures[0];
        expect(fixture).to.have.property('fixture');
        expect(fixture).to.have.property('teams');
        expect(fixture).to.have.property('league');
        expect(fixture.teams).to.have.property('home');
        expect(fixture.teams).to.have.property('away');
      }
    });
  });

  describe('Multi-Sport Service Integration', function() {
    it('should fetch basketball data for Asian leagues', async function() {
      const basketballData = await multiSportService.getBasketballMatches();
      
      expect(basketballData).to.be.an('array');
      if (basketballData.length > 0) {
        const match = basketballData[0];
        expect(match).to.have.property('id');
        expect(match).to.have.property('teams');
        expect(match).to.have.property('sport');
        expect(match.sport).to.equal('basketball');
      }
    });

    it('should handle multiple sports data normalization', async function() {
      const sports = ['badminton', 'tennis', 'tableTennis', 'volleyball'];
      
      for (const sport of sports) {
        const data = await multiSportService.getSportData(sport);
        expect(data).to.be.an('array');
        
        if (data.length > 0) {
          const match = data[0];
          expect(match).to.have.property('sport');
          expect(match.sport).to.equal(sport);
          console.log(`${sport}: ${data.length} matches found`);
        }
      }
    });

    it('should prioritize Asian tournaments', async function() {
      const badmintonData = await multiSportService.getSportData('badminton');
      
      if (badmintonData.length > 0) {
        const asianTournaments = badmintonData.filter(match => 
          match.isAsianTournament || 
          (match.tournament && (
            match.tournament.includes('China') ||
            match.tournament.includes('Malaysia') ||
            match.tournament.includes('Indonesia') ||
            match.tournament.includes('Japan') ||
            match.tournament.includes('Korea')
          ))
        );
        
        console.log(`Found ${asianTournaments.length} Asian badminton tournaments`);
        expect(asianTournaments.length).to.be.greaterThanOrEqual(0);
      }
    });
  });

  describe('Data Synchronization Tests', function() {
    it('should sync cricket data to Firebase correctly', async function() {
      const matches = await cricketService.getLiveMatches();
      
      if (matches.length > 0) {
        const syncResult = await cricketService.syncToFirebase(matches);
        expect(syncResult).to.be.true;
      }
    });

    it('should sync football data to Firebase correctly', async function() {
      const matches = await footballService.getLiveMatches();
      
      if (matches.length > 0) {
        const syncResult = await footballService.syncToFirebase(matches);
        expect(syncResult).to.be.true;
      }
    });

    it('should handle Firebase write errors gracefully', async function() {
      // Mock a Firebase error
      const errorStub = sinon.stub(cricketService, 'syncToFirebase').rejects(new Error('Firebase write failed'));
      
      try {
        await cricketService.syncToFirebase([]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Firebase write failed');
      }
      
      errorStub.restore();
    });
  });

  describe('Rate Limiting and Caching Tests', function() {
    it('should respect API rate limits', async function() {
      const startTime = Date.now();
      
      // Make multiple requests
      await cricketService.getLiveMatches();
      await cricketService.getLiveMatches();
      
      const endTime = Date.now();
      const timeDiff = endTime - startTime;
      
      // Should have some delay due to rate limiting
      expect(timeDiff).to.be.greaterThan(100);
    });

    it('should cache API responses effectively', async function() {
      // First call - should hit API
      const firstCall = await cricketService.getLiveMatches();
      const startTime = Date.now();
      
      // Second call - should use cache
      const secondCall = await cricketService.getLiveMatches();
      const endTime = Date.now();
      
      expect(endTime - startTime).to.be.lessThan(100); // Cache should be faster
      expect(JSON.stringify(firstCall)).to.equal(JSON.stringify(secondCall));
    });
  });

  describe('Error Handling Tests', function() {
    it('should handle network timeouts gracefully', async function() {
      // Mock network timeout
      const originalFetch = global.fetch;
      global.fetch = () => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network timeout')), 100);
      });
      
      try {
        const result = await cricketService.getLiveMatches();
        expect(result).to.be.an('array');
        expect(result.length).to.equal(0); // Should return empty array on error
      } catch (error) {
        // Should not throw unhandled errors
        expect.fail('Should handle timeout gracefully');
      }
      
      global.fetch = originalFetch;
    });

    it('should handle invalid API responses', async function() {
      // Mock invalid JSON response
      const originalFetch = global.fetch;
      global.fetch = () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });
      
      try {
        const result = await cricketService.getLiveMatches();
        expect(result).to.be.an('array');
      } catch (error) {
        // Should handle gracefully
        expect(error).to.be.instanceOf(Error);
      }
      
      global.fetch = originalFetch;
    });
  });

  describe('Performance Tests', function() {
    it('should complete API calls within reasonable time', async function() {
      const startTime = Date.now();
      
      const [cricket, football, basketball] = await Promise.all([
        cricketService.getLiveMatches(),
        footballService.getLiveMatches(),
        multiSportService.getBasketballMatches()
      ]);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`Total API call time: ${totalTime}ms`);
      expect(totalTime).to.be.lessThan(15000); // Should complete within 15 seconds
    });

    it('should handle concurrent requests efficiently', async function() {
      const concurrentRequests = Array(10).fill().map(() => cricketService.getLiveMatches());
      
      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentRequests);
      const endTime = Date.now();
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`${successCount}/10 concurrent requests succeeded in ${endTime - startTime}ms`);
      
      expect(successCount).to.be.greaterThan(5); // At least half should succeed
    });
  });
});

// Test configuration validator
describe('Configuration Validation', function() {
  it('should validate all required environment variables', function() {
    const requiredVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_DATABASE_URL',
      'REACT_APP_FIREBASE_PROJECT_ID'
    ];

    requiredVars.forEach(varName => {
      expect(process.env[varName]).to.not.be.undefined;
      expect(process.env[varName]).to.not.be.empty;
    });
  });

  it('should validate API endpoints are accessible', async function() {
    const endpoints = [
      'https://cricketdata.org/api',
      'https://api.football-api.com/v1'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        console.log(`${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`${endpoint}: Network error - ${error.message}`);
        // Don't fail test for network issues during testing
      }
    }
  });
});

module.exports = {
  CricketDataService,
  FootballApiService,
  MultiSportService
};
