# MatchArena 🏏⚽🏐

<img src="public/logo192.png" alt="MatchArena Logo" width="120" />

**MatchArena** is a production-ready, real-time multi-sport score-tracking and community platform. Track live scores, engage with sports communities, and stay updated with your favorite sports - Cricket, Football, and Kabaddi.

[![Build Status](https://github.com/Harshitkumar07/MatchArena/workflows/Basic%20Build%20Check/badge.svg)](https://github.com/Harshitkumar07/MatchArena/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

### Core Features
- **Real-time Score Updates**: Live scores powered by Firebase Realtime Database
- **Multi-Sport Support**: Cricket, Football, Kabaddi (easily extensible)
- **Community Forums**: Reddit-style discussions per sport
- **User Authentication**: Email/Password and Google OAuth via Firebase Auth
- **Role-based Access**: User, Moderator, and Admin roles
- **Responsive Design**: Mobile-first, accessible UI with Tailwind CSS
- **PWA Support**: Installable progressive web app with offline capabilities
- **Dark/Light Theme**: User preference-based theme switching

### Community Features
- Create and edit posts with rich text
- Nested commenting system
- Upvote/Downvote functionality
- Content reporting and moderation
- Real-time notifications
- User profiles and preferences

### Admin Features
- Content moderation dashboard
- User management
- Match data override capabilities
- System settings management
- Reports queue management

## 📋 Prerequisites

- Node.js 18+ LTS
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with enabled services:
  - Authentication
  - Realtime Database
  - Cloud Functions
  - Hosting

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/Harshitkumar07/MatchArena.git
cd MatchArena
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase Functions**
```bash
cd functions
npm install
cd ..
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration. See [Firebase Setup Guide](./docs/FIREBASE_SETUP.md) for detailed instructions.

5. **Configure Firebase Functions and APIs**

See the comprehensive guides:
- [API Setup Guide](./docs/API_SETUP.md) - Configure cricket, football, and multi-sport APIs
- [Firebase Setup Guide](./docs/FIREBASE_SETUP.md) - Complete Firebase configuration

## 🚀 Development

### Start the development server with Firebase emulators

```bash
# Terminal 1: Start Firebase emulators
npm run emulators

# Terminal 2: Start React development server
npm start
```

The app will be available at:
- React App: http://localhost:3000
- Firebase Emulator UI: http://localhost:4000

### Seed sample data to emulators

```bash
npm run seed
```

## 📦 Build & Deployment

### Build for production

```bash
npm run build
```

### Deploy to Firebase

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### CI/CD with GitHub Actions

The project includes GitHub Actions workflows for:
- Pull Request checks (linting, tests, build)
- Automatic deployment to Firebase on merge to main

Set up GitHub Secrets:
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON
- `FIREBASE_PROJECT_ID`: Your Firebase project ID

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run E2E tests
```bash
npm run test:e2e
```

### Run linting
```bash
npm run lint
```

## 📁 Project Structure

```
matcharena/
├── src/                          # React application source
│   ├── components/               # Reusable UI components
│   │   ├── cricket/             # Cricket-specific components
│   │   ├── football/            # Football-specific components
│   │   ├── basketball/          # Basketball-specific components
│   │   └── [shared components]   # Cross-sport components
│   ├── pages/                   # Page components & routes
│   ├── services/                # API and Firebase services
│   │   ├── api/                # Sports API adapters
│   │   │   ├── adapters/       # Sport-specific API adapters
│   │   │   └── sports/         # Individual sport APIs
│   │   └── firebase/           # Firebase client utilities
│   ├── hooks/                  # Custom React hooks
│   ├── contexts/               # React contexts (Auth, Theme, etc.)
│   ├── utils/                  # Utility functions
│   ├── config/                 # App configuration
│   └── __tests__/              # Component tests
├── functions/                   # Firebase Cloud Functions
│   ├── src/                    # Functions source code
│   │   ├── api/               # HTTP endpoints
│   │   ├── services/          # Business logic services
│   │   ├── mappers/           # Data transformation
│   │   └── config/            # Functions configuration
│   └── package.json           # Functions dependencies
├── public/                     # Static assets
│   └── api/                   # Static API mock data
├── tests/                     # Test suites
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── e2e/                 # End-to-end tests (Cypress)
│   └── fixtures/            # Test data
├── scripts/                  # Utility scripts
├── docs/                    # Documentation
│   ├── README.md           # Documentation index
│   ├── API_SETUP.md        # API configuration guide
│   ├── FIREBASE_SETUP.md   # Firebase setup guide
│   ├── DEPLOYMENT.md       # Deployment instructions
│   └── adr/               # Architecture Decision Records
├── .github/                # GitHub Actions workflows
│   └── workflows/         # CI/CD pipeline definitions
└── [config files]         # Package.json, Firebase config, etc.
```

## 🔐 Security

### Database Security Rules
- Role-based access control (RBAC)
- Input validation at database level
- Rate limiting on write operations

### Content Security
- DOMPurify for user-generated content sanitization
- CSP headers configured in Firebase Hosting
- API keys stored in Cloud Functions config

### Authentication
- Firebase Auth with email verification
- OAuth providers (Google)
- Custom claims for role management

## 🌐 API Integration

### Adding a New Sport

1. Create an adapter in `src/services/api/adapters/`
2. Implement the `SportAdapter` interface
3. Add sport to `SUPPORTED_SPORTS` in config
4. Create Cloud Function for data polling
5. Update database schema if needed

### Supported Sports APIs
- **Cricket**: CricAPI
- **Football**: (Configure your provider)
- **Kabaddi**: (Configure your provider)

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow
1. Create a feature branch from `develop`
2. Make your changes
3. Write/update tests
4. Submit a pull request to `develop`
5. After review, it will be merged to `main` for deployment

## 📝 Environment Variables

### Client-side (.env)
- `REACT_APP_ENV` - Environment (development/staging/production)
- `REACT_APP_FIREBASE_*` - Firebase configuration
- `REACT_APP_ANALYTICS_ENABLED` - Enable/disable analytics
- `REACT_APP_SENTRY_DSN` - Error tracking (optional)

### Server-side (Firebase Functions config)
- `cric.api_key` - CricAPI key
- `discord.webhook` - Discord webhook URL
- `admin.allowed_emails` - Admin email addresses
- `security.allowed_origins` - CORS allowed origins

## 🐛 Troubleshooting

### Common Issues

**Firebase emulators not starting**
```bash
firebase emulators:start --import=./emulator-data --export-on-exit
```

**Build fails with memory error**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Authentication not working locally**
- Ensure emulators are running
- Check Firebase project configuration
- Verify environment variables

## 📊 Performance

- Lighthouse Score: 95+ (Performance, Accessibility, Best Practices, SEO)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Code splitting and lazy loading
- Image optimization and lazy loading
- Service worker for offline support

## 🚢 Production Checklist

- [ ] Update environment variables for production
- [ ] Configure Firebase Functions config for production
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy for database
- [ ] Review and update security rules
- [ ] Set up custom domain in Firebase Hosting
- [ ] Configure CDN if needed
- [ ] Set up error tracking (Sentry)
- [ ] Configure rate limiting
- [ ] Review CSP headers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- CricAPI for cricket data
- React and Tailwind CSS communities
- All contributors and testers

## 📞 Support

For support, email support@matcharena.com or join our Discord server.

---

**Built with ❤️ by the MatchArena Team**
