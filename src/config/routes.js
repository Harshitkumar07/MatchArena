import { lazy } from 'react';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('../pages/Home'));
const ExplorePage = lazy(() => import('../pages/Explore'));
const MatchListPage = lazy(() => import('../pages/MatchList'));
const MatchDetailPage = lazy(() => import('../pages/MatchDetail'));
const SeriesPage = lazy(() => import('../pages/Series'));
const CommunityPage = lazy(() => import('../pages/Community'));
const PostDetailPage = lazy(() => import('../pages/PostDetail'));
const ProfilePage = lazy(() => import('../pages/Profile'));
const AdminPage = lazy(() => import('../pages/Admin'));
const AuthPage = lazy(() => import('../pages/Auth'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));
const ApiTestPage = lazy(() => import('../components/ApiTestPage'));

// Route configuration
export const routes = [
  {
    path: '/',
    element: HomePage,
    title: 'Home',
    isPublic: true,
    showInNav: true,
    icon: 'home'
  },
  {
    path: '/explore',
    element: ExplorePage,
    title: 'Explore',
    isPublic: true,
    showInNav: true,
    icon: 'explore'
  },
  {
    path: '/sport/:sport',
    element: MatchListPage,
    title: 'Matches',
    isPublic: true,
    showInNav: false
  },
  {
    path: '/sport/:sport/match/:matchId',
    element: MatchDetailPage,
    title: 'Match Detail',
    isPublic: true,
    showInNav: false
  },
  {
    path: '/sport/:sport/series',
    element: SeriesPage,
    title: 'Series',
    isPublic: true,
    showInNav: false
  },
  {
    path: '/community/:sport',
    element: CommunityPage,
    title: 'Community',
    isPublic: true,
    showInNav: false
  },
  {
    path: '/community/:sport/post/:postId',
    element: PostDetailPage,
    title: 'Post',
    isPublic: true,
    showInNav: false
  },
  {
    path: '/profile',
    element: ProfilePage,
    title: 'Profile',
    isPublic: false,
    requireAuth: true,
    showInNav: true,
    icon: 'person'
  },
  {
    path: '/admin',
    element: AdminPage,
    title: 'Admin',
    isPublic: false,
    requireAuth: true,
    requireRole: 'admin',
    showInNav: false,
    icon: 'admin'
  },
  {
    path: '/auth',
    element: AuthPage,
    title: 'Sign In',
    isPublic: true,
    showInNav: false
  },
  {
    path: '*',
    element: NotFoundPage,
    title: '404 Not Found',
    isPublic: true,
    showInNav: false
  }
];

// Sports configuration
export const SUPPORTED_SPORTS = [
  {
    id: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    color: 'green',
    enabled: true,
    description: 'Follow live cricket scores, series, and community discussions'
  },
  {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    color: 'blue',
    enabled: true,
    description: 'Track football matches, leagues, and connect with fans'
  },
  {
    id: 'kabaddi',
    name: 'Kabaddi',
    icon: '🤼',
    color: 'orange',
    enabled: true,
    description: 'Stay updated with kabaddi matches and tournaments'
  }
];

// Alias for backward compatibility
export const SPORTS = SUPPORTED_SPORTS;

// Match status configurations
export const MATCH_STATUS = {
  LIVE: 'live',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed'
};

// User roles
export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

// API endpoints (for cloud functions)
export const API_ENDPOINTS = {
  MATCHES: '/matches',
  SERIES: '/series',
  POSTS: '/posts',
  COMMENTS: '/comments',
  USERS: '/users',
  ADMIN: '/admin'
};

// App configuration
export const APP_CONFIG = {
  appName: 'MatchArena',
  appTagline: 'Real-time Sports Tracking & Community',
  appDescription: 'Track live scores and engage with sports communities',
  defaultSport: 'cricket',
  postsPerPage: 20,
  commentsPerPage: 50,
  matchesPerPage: 20,
  maxPostLength: 20000,
  maxCommentLength: 10000,
  maxTitleLength: 200,
  minTitleLength: 3,
  voteCooldown: 1000, // milliseconds
  searchDebounce: 300, // milliseconds
  realtimePollingInterval: 60000, // 1 minute
  cacheTimeout: 300000, // 5 minutes
  offlineMessageDelay: 3000, // 3 seconds
  maxFileSize: 5242880, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxReportLength: 500,
  moderatorBadgeColor: 'purple',
  adminBadgeColor: 'red'
};

// Feature flags
export const FEATURES = {
  ENABLE_PWA: process.env.REACT_APP_ENABLE_PWA === 'true',
  ENABLE_PUSH_NOTIFICATIONS: process.env.REACT_APP_ENABLE_PUSH_NOTIFICATIONS === 'true',
  ENABLE_ANALYTICS: process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
  ENABLE_DISCORD: false,
  ENABLE_DARK_MODE: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_SOCIAL_SHARING: true,
  ENABLE_EMAIL_NOTIFICATIONS: false,
  ENABLE_ADVANCED_SEARCH: false,
  ENABLE_LIVE_CHAT: false
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_REQUIRED: 'Please sign in to continue.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  INVALID_INPUT: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  NOT_FOUND: 'The requested resource was not found.',
  OFFLINE: 'You are currently offline. Some features may be limited.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  POST_CREATED: 'Post created successfully!',
  POST_UPDATED: 'Post updated successfully!',
  POST_DELETED: 'Post deleted successfully!',
  COMMENT_ADDED: 'Comment added successfully!',
  COMMENT_DELETED: 'Comment deleted successfully!',
  VOTE_RECORDED: 'Your vote has been recorded!',
  REPORT_SUBMITTED: 'Report submitted. Thank you for helping keep our community safe.',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};

export default routes;
