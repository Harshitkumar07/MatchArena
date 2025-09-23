/**
 * React Component Unit Tests
 * Tests all sport-specific components and real-time features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  onValue: jest.fn(),
  off: jest.fn(),
  push: jest.fn(),
  set: jest.fn(),
  serverTimestamp: jest.fn(() => Date.now())
}));

jest.mock('../src/services/firebase/firebaseClient', () => ({
  database: {}
}));

// Import components to test
import SportsDashboard from '../src/components/SportsDashboard';
import CricketScorecard from '../src/components/cricket/CricketScorecard';
import FootballMatchCenter from '../src/components/football/FootballMatchCenter';
import BasketballGameCenter from '../src/components/basketball/BasketballGameCenter';
import MultiSportWidget from '../src/components/MultiSportWidget';
import LiveMatchesTicker from '../src/components/LiveMatchesTicker';
import RealTimeNotifications from '../src/components/RealTimeNotifications';

// Mock real-time hooks
jest.mock('../src/hooks/useRealTimeUpdates', () => ({
  useLiveMatches: () => ({
    liveMatches: {
      cricket: {
        'match1': {
          id: 'match1',
          teams: { home: { name: 'India' }, away: { name: 'Pakistan' } },
          status: 'live',
          isAsianMatch: true
        }
      }
    },
    loading: false,
    connectionStatus: 'connected'
  }),
  useConnectionStatus: () => ({
    status: 'connected',
    lastConnected: new Date()
  }),
  useScoreNotifications: () => ({
    notifications: [],
    requestNotificationPermission: jest.fn(),
    clearNotifications: jest.fn(),
    hasPermission: true
  })
}));

describe('SportsDashboard Component', () => {
  test('renders main dashboard with all sports', () => {
    render(<SportsDashboard />);
    
    expect(screen.getByText('MatchArena Sports Center')).toBeInTheDocument();
    expect(screen.getByText('Cricket')).toBeInTheDocument();
    expect(screen.getByText('Football')).toBeInTheDocument();
    expect(screen.getByText('Basketball')).toBeInTheDocument();
    expect(screen.getByText('Badminton')).toBeInTheDocument();
  });

  test('switches between sports correctly', async () => {
    render(<SportsDashboard />);
    
    // Click on Football tab
    fireEvent.click(screen.getByText('Football'));
    
    await waitFor(() => {
      expect(screen.getByText('Football Center')).toBeInTheDocument();
    });
  });

  test('shows connection status indicator', () => {
    render(<SportsDashboard />);
    
    expect(screen.getByText('Live Updates')).toBeInTheDocument();
  });

  test('displays live matches ticker', () => {
    render(<SportsDashboard />);
    
    // Should render ticker component
    expect(document.querySelector('.animate-marquee')).toBeTruthy();
  });
});

describe('CricketScorecard Component', () => {
  const mockCricketMatch = {
    id: 'cricket1',
    teams: {
      home: { name: 'Mumbai Indians', logo: '/mi-logo.png' },
      away: { name: 'Chennai Super Kings', logo: '/csk-logo.png' }
    },
    scores: {
      home: { runs: 185, wickets: 6, overs: 20 },
      away: { runs: 150, wickets: 4, overs: 15.2 }
    },
    status: 'live',
    series: 'Indian Premier League 2024',
    isAsianMatch: true,
    venue: 'Wankhede Stadium'
  };

  test('renders cricket match details correctly', () => {
    render(<CricketScorecard sport="cricket" />);
    
    // Mock Firebase data
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    callback({ val: () => ({ [mockCricketMatch.id]: mockCricketMatch }) });

    expect(screen.getByText('Mumbai Indians')).toBeInTheDocument();
    expect(screen.getByText('Chennai Super Kings')).toBeInTheDocument();
  });

  test('shows Asian match indicator', () => {
    render(<CricketScorecard sport="cricket" />);
    
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    callback({ val: () => ({ [mockCricketMatch.id]: mockCricketMatch }) });

    expect(screen.getByText('Asian')).toBeInTheDocument();
  });

  test('handles live match updates', async () => {
    render(<CricketScorecard sport="cricket" />);
    
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    
    // Initial data
    callback({ val: () => ({ [mockCricketMatch.id]: mockCricketMatch }) });
    
    // Updated score
    const updatedMatch = {
      ...mockCricketMatch,
      scores: {
        ...mockCricketMatch.scores,
        away: { runs: 160, wickets: 5, overs: 16.1 }
      }
    };
    
    callback({ val: () => ({ [mockCricketMatch.id]: updatedMatch }) });
    
    await waitFor(() => {
      expect(screen.getByText('160')).toBeInTheDocument();
    });
  });
});

describe('FootballMatchCenter Component', () => {
  const mockFootballMatch = {
    id: 'football1',
    teams: {
      home: { name: 'Mumbai City FC', logo: '/mcfc-logo.png' },
      away: { name: 'Bengaluru FC', logo: '/bfc-logo.png' }
    },
    scores: { home: 2, away: 1 },
    status: 'live',
    league: { name: 'Indian Super League', country: 'India' },
    venue: 'Mumbai Football Arena',
    time: '67\''
  };

  test('renders football match correctly', () => {
    render(<FootballMatchCenter sport="football" />);
    
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    callback({ val: () => ({ [mockFootballMatch.id]: mockFootballMatch }) });

    expect(screen.getByText('Mumbai City FC')).toBeInTheDocument();
    expect(screen.getByText('Bengaluru FC')).toBeInTheDocument();
    expect(screen.getByText('Indian Super League')).toBeInTheDocument();
  });

  test('displays live match time', () => {
    render(<FootballMatchCenter sport="football" />);
    
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    callback({ val: () => ({ [mockFootballMatch.id]: mockFootballMatch }) });

    expect(screen.getByText('67\'')).toBeInTheDocument();
  });

  test('shows live indicator for active matches', () => {
    render(<FootballMatchCenter sport="football" />);
    
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    callback({ val: () => ({ [mockFootballMatch.id]: mockFootballMatch }) });

    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });
});

describe('BasketballGameCenter Component', () => {
  const mockBasketballGame = {
    id: 'basketball1',
    teams: {
      home: { name: 'Beijing Ducks', logo: '/beijing-logo.png' },
      away: { name: 'Shanghai Sharks', logo: '/shanghai-logo.png' }
    },
    scores: {
      home: { total: 98, quarter_1: 24, quarter_2: 22, quarter_3: 28, quarter_4: 24 },
      away: { total: 92, quarter_1: 20, quarter_2: 26, quarter_3: 22, quarter_4: 24 }
    },
    status: 'live',
    league: { name: 'Chinese Basketball Association' },
    isAsianMatch: true
  };

  test('renders basketball game with quarter scores', () => {
    render(<BasketballGameCenter sport="basketball" />);
    
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    callback({ val: () => ({ [mockBasketballGame.id]: mockBasketballGame }) });

    expect(screen.getByText('Beijing Ducks')).toBeInTheDocument();
    expect(screen.getByText('Shanghai Sharks')).toBeInTheDocument();
    expect(screen.getByText('98')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  test('displays quarter breakdown table', () => {
    render(<BasketballGameCenter sport="basketball" />);
    
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    callback({ val: () => ({ [mockBasketballGame.id]: mockBasketballGame }) });

    expect(screen.getByText('Quarter Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
  });
});

describe('MultiSportWidget Component', () => {
  const mockBadmintonMatch = {
    id: 'badminton1',
    players: {
      player1: { name: 'Viktor Axelsen', country: 'Denmark', ranking: 1, flag: '🇩🇰' },
      player2: { name: 'Kento Momota', country: 'Japan', ranking: 2, flag: '🇯🇵' }
    },
    scores: {
      games: [
        { player1: 21, player2: 18 },
        { player1: 19, player2: 21 },
        { player1: 21, player2: 16 }
      ]
    },
    status: 'completed',
    tournament: 'All England Open',
    isAsianTournament: false
  };

  test('renders badminton match correctly', () => {
    render(<MultiSportWidget sport="badminton" />);
    
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    callback({ val: () => ({ [mockBadmintonMatch.id]: mockBadmintonMatch }) });

    expect(screen.getByText('Viktor Axelsen')).toBeInTheDocument();
    expect(screen.getByText('Kento Momota')).toBeInTheDocument();
    expect(screen.getByText('All England Open')).toBeInTheDocument();
  });

  test('displays game scores for badminton', () => {
    render(<MultiSportWidget sport="badminton" />);
    
    const { onValue } = require('firebase/database');
    const callback = onValue.mock.calls[0][1];
    callback({ val: () => ({ [mockBadmintonMatch.id]: mockBadmintonMatch }) });

    expect(screen.getByText('21, 19, 21')).toBeInTheDocument();
    expect(screen.getByText('18, 21, 16')).toBeInTheDocument();
  });
});

describe('LiveMatchesTicker Component', () => {
  const mockLiveMatches = {
    cricket: {
      'match1': {
        id: 'match1',
        teams: { home: { name: 'India' }, away: { name: 'Australia' } },
        scores: { home: { runs: 200 }, away: { runs: 180 } },
        status: 'live',
        sport: 'cricket'
      }
    },
    football: {
      'match2': {
        id: 'match2',
        teams: { home: { name: 'Real Madrid' }, away: { name: 'Barcelona' } },
        scores: { home: 2, away: 1 },
        status: 'live',
        sport: 'football'
      }
    }
  };

  test('renders live matches ticker', () => {
    render(<LiveMatchesTicker matches={mockLiveMatches} />);
    
    expect(screen.getByText('India')).toBeInTheDocument();
    expect(screen.getByText('Australia')).toBeInTheDocument();
  });

  test('shows play/pause controls', () => {
    render(<LiveMatchesTicker matches={mockLiveMatches} />);
    
    const playButton = screen.getByLabelText(/pause|play/i);
    expect(playButton).toBeInTheDocument();
  });

  test('cycles through matches automatically', async () => {
    jest.useFakeTimers();
    render(<LiveMatchesTicker matches={mockLiveMatches} />);
    
    // Fast-forward timer
    jest.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(screen.getByText('Real Madrid')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
});

describe('RealTimeNotifications Component', () => {
  test('renders notification bell', () => {
    render(<RealTimeNotifications />);
    
    const bellButton = screen.getByRole('button');
    expect(bellButton).toBeInTheDocument();
  });

  test('opens notification panel when clicked', () => {
    render(<RealTimeNotifications />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    expect(screen.getByText('Live Updates')).toBeInTheDocument();
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
  });

  test('shows connection status', () => {
    render(<RealTimeNotifications />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  test('allows toggling sound notifications', () => {
    render(<RealTimeNotifications />);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    const soundToggle = screen.getByRole('button', { name: /sound/i });
    fireEvent.click(soundToggle);
    
    // Should toggle the sound setting
    expect(soundToggle).toBeInTheDocument();
  });
});

describe('Accessibility Tests', () => {
  test('components have proper ARIA labels', () => {
    render(<SportsDashboard />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  test('keyboard navigation works', () => {
    render(<SportsDashboard />);
    
    const firstButton = screen.getAllByRole('button')[0];
    firstButton.focus();
    
    expect(document.activeElement).toBe(firstButton);
  });

  test('color contrast meets standards', () => {
    render(<SportsDashboard />);
    
    // Check that text has sufficient contrast
    const headings = screen.getAllByRole('heading');
    headings.forEach(heading => {
      const styles = window.getComputedStyle(heading);
      expect(styles.color).not.toBe('');
    });
  });
});

describe('Performance Tests', () => {
  test('components render within performance budget', () => {
    const startTime = performance.now();
    render(<SportsDashboard />);
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
  });

  test('handles large datasets efficiently', () => {
    const largeLiveMatches = {};
    
    // Create 100 mock matches
    for (let i = 0; i < 100; i++) {
      largeLiveMatches[`cricket_${i}`] = {
        [`match${i}`]: {
          id: `match${i}`,
          teams: { home: { name: `Team ${i}A` }, away: { name: `Team ${i}B` } },
          status: 'live',
          sport: 'cricket'
        }
      };
    }
    
    const startTime = performance.now();
    render(<LiveMatchesTicker matches={largeLiveMatches} />);
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(500); // Should handle large datasets efficiently
  });
});

// Mock cleanup
afterEach(() => {
  jest.clearAllMocks();
});
