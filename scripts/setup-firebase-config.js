#!/usr/bin/env node

/**
 * Firebase Functions Configuration Setup Script
 * This script helps you configure your API keys securely in Firebase Functions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 MatchArena Firebase Configuration Setup');
console.log('==========================================\n');

// Read environment variables from .env files
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').replace(/['"]/g, '');
      }
    }
  });
  
  return env;
}

// Load API keys from environment files
const envLocal = loadEnvFile('.env.local');
const env = loadEnvFile('.env');

const cricketApiKey = envLocal.REACT_APP_CRICKET_API_KEY || env.REACT_APP_CRICKET_API_KEY;
const footballApiKey = envLocal.REACT_APP_SPORTS_API_KEY || env.REACT_APP_SPORTS_API_KEY;

console.log('📋 Found Configuration:');
console.log(`Cricket API Key: ${cricketApiKey ? '✅ Found' : '❌ Missing'}`);
console.log(`Football API Key: ${footballApiKey ? '✅ Found' : '❌ Missing'}`);
console.log('');

if (!cricketApiKey || !footballApiKey) {
  console.log('❌ Missing API keys! Please ensure you have:');
  console.log('   - REACT_APP_CRICKET_API_KEY in your .env or .env.local');
  console.log('   - REACT_APP_SPORTS_API_KEY in your .env or .env.local');
  console.log('');
  process.exit(1);
}

// Firebase Functions configuration commands
const commands = [
  {
    name: 'Cricket API Key',
    command: `firebase functions:config:set cricket.api_key="${cricketApiKey}"`
  },
  {
    name: 'Football API Key', 
    command: `firebase functions:config:set football.api_key="${footballApiKey}"`
  },
  {
    name: 'Admin Emails',
    command: 'firebase functions:config:set admin.allowed_emails="admin@matcharena.com"'
  },
  {
    name: 'Security Origins',
    command: 'firebase functions:config:set security.allowed_origins="http://localhost:3000,https://matcharena-app-e3d24.web.app,https://matcharena-app-e3d24.firebaseapp.com"'
  },
  {
    name: 'App Environment',
    command: 'firebase functions:config:set app.environment="production"'
  }
];

console.log('🚀 Setting up Firebase Functions configuration...\n');

let successCount = 0;
let failCount = 0;

for (const config of commands) {
  try {
    console.log(`Setting ${config.name}...`);
    execSync(config.command, { stdio: 'inherit' });
    console.log(`✅ ${config.name} configured successfully\n`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to configure ${config.name}`);
    console.error(`Command: ${config.command}`);
    console.error(`Error: ${error.message}\n`);
    failCount++;
  }
}

console.log('📊 Configuration Summary:');
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);

if (failCount === 0) {
  console.log('\n🎉 All configurations set successfully!');
  console.log('\nNext steps:');
  console.log('1. Deploy your functions: npm run deploy:functions');
  console.log('2. Test your API endpoints');
  console.log('3. Deploy your frontend: npm run deploy');
} else {
  console.log('\n⚠️  Some configurations failed. Please check the errors above.');
  console.log('Make sure you are logged into Firebase: firebase login');
  console.log('Make sure you have selected the correct project: firebase use <project-id>');
}

console.log('\n📱 Test your setup:');
console.log('- Development: npm run emulators');
console.log('- Production: Check Firebase Console > Functions');

// Create a verification script
const verificationScript = `
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
`;

fs.writeFileSync('functions/src/verify-config.js', verificationScript);
console.log('\n📋 Created verification script at functions/src/verify-config.js');
console.log('You can add this to your functions/index.js to test configuration.');
