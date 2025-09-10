# MatchArena 🏏⚽🏐

<img src="public/logo192.png" alt="MatchArena Logo" width="120" />

**MatchArena** is a production-ready, real-time multi-sport score-tracking and community platform. Track live scores, engage with sports communities, and stay updated with your favorite sports - Cricket, Football, and Kabaddi.

[![Build Status](https://github.com/yourusername/matcharena/workflows/CI/badge.svg)](https://github.com/yourusername/matcharena/actions)
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
git clone https://github.com/yourusername/matcharena.git
cd matcharena
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

Edit `.env` with your Firebase configuration:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
# ... other config
```

5. **Configure Firebase Functions environment**
```bash
# Set API keys for sports data providers
firebase functions:config:set cric.api_key="YOUR_CRICAPI_KEY"

# Set admin emails (comma-separated)
firebase functions:config:set admin.allowed_emails="admin@example.com,admin2@example.com"

# Optional: Discord webhook for notifications
firebase functions:config:set discord.webhook="YOUR_DISCORD_WEBHOOK_URL"
```

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
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components
│   ├── services/         # API and Firebase services
│   │   ├── api/         # Sports API adapters
│   │   └── firebase/    # Firebase client utilities
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # React contexts (Auth, Theme, etc.)
│   ├── utils/           # Utility functions
│   ├── config/          # App configuration
│   └── styles/          # Global styles
├── functions/           # Firebase Cloud Functions
│   ├── src/
│   │   ├── triggers/   # Database triggers
│   │   ├── scheduled/  # Scheduled functions
│   │   └── callable/   # Callable functions
├── public/             # Static assets
├── tests/              # Test suites
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   ├── e2e/          # End-to-end tests
│   └── fixtures/      # Test data
├── scripts/           # Utility scripts
├── docs/              # Documentation
│   └── adr/          # Architecture Decision Records
└── .github/          # GitHub Actions workflows
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
