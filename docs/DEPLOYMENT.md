# Deployment Guide for MatchArena

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- Node.js 18.x or higher
- npm 9.x or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Accounts Required
- Firebase Account (with project created)
- GitHub Account (for CI/CD)
- Sports API accounts (CricAPI, Football-Data.org, etc.)

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/matcharena.git
cd matcharena
```

### 2. Install Dependencies
```bash
# Install main dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 3. Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
```

### 4. Firebase Setup
```bash
# Login to Firebase
firebase login

# Select or create project
firebase use --add

# Initialize Firebase services
firebase init
```

## Local Development

### Start Development Server
```bash
# Start React development server
npm start

# In another terminal, start Firebase emulators
npm run emulators
```

### Seed Test Data
```bash
npm run seed
```

### Access Points
- React App: http://localhost:3000
- Firebase Emulator UI: http://localhost:4000
- Functions: http://localhost:5001
- Auth Emulator: http://localhost:9099
- Database Emulator: http://localhost:9000

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in CI mode
npm run test:ci
```

### E2E Tests
```bash
# Open Cypress Test Runner
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run
```

### Linting and Formatting
```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format
```

## Deployment

### Manual Deployment

#### Deploy to Staging
```bash
npm run deploy:staging
```

#### Deploy to Production
```bash
npm run deploy:prod
```

#### Deploy Specific Services
```bash
# Deploy hosting only
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions

# Deploy database rules
firebase deploy --only database

# Deploy storage rules
firebase deploy --only storage
```

### Automated Deployment (CI/CD)

The project uses GitHub Actions for automated deployment:

1. **Development Branch**: Automatically deploys to staging
2. **Main Branch**: Automatically deploys to production
3. **Pull Requests**: Runs tests and builds

#### Setting up GitHub Actions

1. Add secrets to GitHub repository:
   - `FIREBASE_TOKEN`: Get with `firebase login:ci`
   - `FIREBASE_API_KEY`: From Firebase Console
   - `FIREBASE_AUTH_DOMAIN`: From Firebase Console
   - `FIREBASE_DATABASE_URL`: From Firebase Console
   - `FIREBASE_PROJECT_ID`: From Firebase Console
   - `FIREBASE_STORAGE_BUCKET`: From Firebase Console
   - `FIREBASE_MESSAGING_SENDER_ID`: From Firebase Console
   - `FIREBASE_APP_ID`: From Firebase Console
   - `CYPRESS_RECORD_KEY`: From Cypress Dashboard (optional)
   - `SNYK_TOKEN`: From Snyk Dashboard (optional)

2. Configure branch protection rules:
   - Require pull request reviews
   - Require status checks to pass
   - Include administrators

### Production Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Security rules updated
- [ ] Performance budgets met
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] SSL certificates valid
- [ ] Rate limiting configured

## Monitoring

### Firebase Console
- Monitor real-time database usage
- Check function execution logs
- Review authentication metrics
- Analyze hosting bandwidth

### Performance Monitoring
```bash
# Run Lighthouse audit
npm run lighthouse

# Analyze bundle size
npm run analyze
```

### Error Tracking
- Check Firebase Crashlytics
- Review Cloud Functions logs
- Monitor client-side errors

### Analytics
- Firebase Analytics dashboard
- Custom event tracking
- User engagement metrics

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Firebase Deployment Errors
```bash
# Re-authenticate
firebase login --reauth

# Check project configuration
firebase projects:list
firebase use <project-id>
```

#### Functions Not Deploying
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions --debug
```

#### Database Permission Errors
```bash
# Update database rules
firebase deploy --only database
```

### Debug Mode
```bash
# Run with debug logging
DEBUG=* npm start

# Firebase debug mode
firebase deploy --debug
```

### Rollback Procedures

#### Hosting Rollback
```bash
# List releases
firebase hosting:releases:list

# Rollback to previous
firebase hosting:rollback
```

#### Functions Rollback
```bash
# Via Firebase Console or
firebase functions:delete <functionName>
# Then redeploy previous version
```

## Performance Optimization

### Build Optimization
```bash
# Production build with optimizations
npm run build

# Analyze bundle
npm run analyze
```

### Caching Strategy
- Static assets: 1 year cache
- API responses: 5 minute cache
- User data: No cache

### Database Indexes
```json
{
  "rules": {
    ".indexOn": ["timestamp", "sport", "status"]
  }
}
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use Firebase Functions for API calls
3. **Authentication**: Implement proper auth checks
4. **Rate Limiting**: Configure per-user limits
5. **Input Validation**: Sanitize all user inputs
6. **CORS**: Configure appropriate origins
7. **Security Headers**: Use Helmet.js in functions

## Backup and Recovery

### Database Backup
```bash
# Export database
firebase database:get / -o backup.json

# Import database
firebase database:set / backup.json
```

### Automated Backups
- Configure Firebase Backups in Console
- Set retention period (30 days recommended)

## Support

For issues and questions:
- GitHub Issues: [github.com/your-org/matcharena/issues]
- Email: support@matcharena.com
- Documentation: [docs.matcharena.com]

## License

MIT License - See LICENSE file for details
