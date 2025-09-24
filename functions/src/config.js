const functions = require('firebase-functions');

// Get configuration from Firebase Functions config or local runtime config
const getConfig = () => {
  try {
    // Try to get production config from Firebase Functions
    const config = functions.config();
    
    return {
      cricapi: {
        key: config.cricapi?.key || process.env.CRICAPI_KEY,
        baseUrl: 'https://api.cricapi.com/v1'
      },
      apisports: {
        key: config.apisports?.key || process.env.APISPORTS_KEY,
        hosts: {
          football: 'https://v3.football.api-sports.io',
          basketball: 'https://v1.basketball.api-sports.io', 
          baseball: 'https://v1.baseball.api-sports.io',
          hockey: 'https://v1.hockey.api-sports.io',
          tennis: 'https://v1.tennis.api-sports.io',
          volleyball: 'https://v1.volleyball.api-sports.io',
          handball: 'https://v1.handball.api-sports.io',
          rugby: 'https://v1.rugby.api-sports.io',
          'american-football': 'https://v1.american-football.api-sports.io'
        }
      },
      app: {
        allowedOrigins: [
          'http://localhost:3000',
          'http://localhost:5000',
          'https://matcharena-app-e3d24.web.app',
          'https://matcharena-app-e3d24.firebaseapp.com'
        ]
      }
    };
  } catch (error) {
    console.error('Config error:', error);
    // Return default config for local development
    return {
      cricapi: {
        key: process.env.CRICAPI_KEY || 'bdc46755-7e68-459e-a2ab-b79ad1d50554',
        baseUrl: 'https://api.cricapi.com/v1'
      },
      apisports: {
        key: process.env.APISPORTS_KEY || 'd11dca33082525388b3b094a8f4b31ae',
        hosts: {
          football: 'https://v3.football.api-sports.io',
          basketball: 'https://v1.basketball.api-sports.io',
          baseball: 'https://v1.baseball.api-sports.io',
          hockey: 'https://v1.hockey.api-sports.io',
          tennis: 'https://v1.tennis.api-sports.io',
          volleyball: 'https://v1.volleyball.api-sports.io',
          handball: 'https://v1.handball.api-sports.io',
          rugby: 'https://v1.rugby.api-sports.io',
          'american-football': 'https://v1.american-football.api-sports.io'
        }
      },
      app: {
        allowedOrigins: [
          'http://localhost:3000',
          'http://localhost:5000',
          'https://matcharena-app-e3d24.web.app',
          'https://matcharena-app-e3d24.firebaseapp.com'
        ]
      }
    };
  }
};

module.exports = { getConfig };