
// Verification script - run this in Firebase Functions environment
const functions = require('firebase-functions');

exports.verifyConfig = functions.https.onRequest((req, res) => {
  const config = {
    cricket: {
      hasApiKey: !!functions.config().cricket?.api_key,
      keyPreview: functions.config().cricket?.api_key ? 
        functions.config().cricket.api_key.substring(0, 8) + '...' : 'Not set'
    },
    football: {
      hasApiKey: !!functions.config().football?.api_key,
      keyPreview: functions.config().football?.api_key ? 
        functions.config().football.api_key.substring(0, 8) + '...' : 'Not set'
    },
    admin: {
      emails: functions.config().admin?.allowed_emails || 'Not set'
    },
    security: {
      origins: functions.config().security?.allowed_origins || 'Not set'
    }
  };
  
  res.json({
    success: true,
    message: 'Configuration verification',
    config: config,
    timestamp: new Date().toISOString()
  });
});
