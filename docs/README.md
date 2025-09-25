# MatchArena Documentation

Welcome to the MatchArena documentation! This directory contains comprehensive guides and documentation for the MatchArena sports platform.

## 📋 Documentation Index

### Setup & Configuration
- [**API Setup Guide**](./API_SETUP.md) - Configure cricket, football, and multi-sport APIs
- [**Firebase Setup Guide**](./FIREBASE_SETUP.md) - Complete Firebase configuration walkthrough
- [**Deployment Guide**](./DEPLOYMENT.md) - Production deployment instructions
- [**Production Deployment Guide**](./PRODUCTION_DEPLOYMENT_GUIDE.md) - Advanced production setup

### Architecture & Development
- [**Architecture Decision Records (ADRs)**](./adr/) - Technical decisions and their rationale
- [**Project Structure**](../README.md#-project-structure) - Detailed project organization

## 🚀 Quick Start

1. **Initial Setup**
   ```bash
   # Clone and install dependencies
   git clone https://github.com/Harshitkumar07/MatchArena.git
   cd MatchArena
   npm install
   cd functions && npm install && cd ..
   ```

2. **Configure APIs** (Follow [API Setup Guide](./API_SETUP.md))
   - Cricket API (CricAPI)
   - Football API (API-Sports)
   - Firebase services

3. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Fill in your configuration values
   ```

4. **Start Development**
   ```bash
   # Terminal 1: Firebase emulators
   npm run emulators
   
   # Terminal 2: React app
   npm start
   ```

## 📁 Documentation Structure

```
docs/
├── README.md                    # This file - documentation index
├── API_SETUP.md                 # API configuration guide
├── FIREBASE_SETUP.md            # Firebase setup instructions
├── DEPLOYMENT.md                # Basic deployment guide
├── PRODUCTION_DEPLOYMENT_GUIDE.md # Advanced production setup
└── adr/                         # Architecture Decision Records
    └── (future ADRs)
```

## 🛠️ Development Workflow

1. **Feature Development**
   - Create feature branch from `develop`
   - Follow project structure guidelines
   - Write tests for new features
   - Update documentation as needed

2. **Testing**
   ```bash
   npm test              # Unit tests
   npm run test:e2e      # End-to-end tests
   npm run test:integration # Integration tests
   ```

3. **Code Quality**
   ```bash
   npm run lint          # ESLint checks
   npm run format        # Prettier formatting
   npm run test:coverage # Coverage reports
   ```

## 🔍 Troubleshooting

### Common Issues

**Build Failures**
- Check Node.js version (18+ required)
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

**API Connection Issues**
- Verify API keys in Firebase Functions config
- Check API quota limits
- Ensure Firebase Functions are deployed

**Firebase Errors**
- Check Firebase project configuration
- Verify database rules
- Ensure emulators are running for development

### Getting Help

1. Check the troubleshooting sections in specific guides
2. Review Firebase console for error logs
3. Run health checks: `npm run health:check`
4. Check GitHub Issues for known problems

## 📄 Additional Resources

- [Main README](../README.md) - Project overview and features
- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute
- [License](../LICENSE) - MIT License details
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://reactjs.org/docs)

## 🆕 Recent Updates

- Consolidated documentation structure
- Removed duplicate setup files
- Streamlined CI/CD workflows
- Enhanced Firebase configuration guide
- Added comprehensive API setup instructions

---

**Last Updated**: December 2024  
**Version**: 2.0.0
