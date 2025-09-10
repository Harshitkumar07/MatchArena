#!/usr/bin/env node
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, serverTimestamp } from 'firebase/database';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { format, addDays, addHours, subDays } from 'date-fns';

// Emulator configuration
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  databaseURL: "http://localhost:9000/?ns=demo-project",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase with emulator
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Connect to emulators
connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

// Sample data generators
const generateMatchId = () => `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateSeriesId = () => `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generatePostId = () => `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateCommentId = () => `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Cricket teams
const cricketTeams = [
  'India', 'Australia', 'England', 'New Zealand', 'Pakistan', 
  'South Africa', 'Sri Lanka', 'West Indies', 'Bangladesh', 'Afghanistan'
];

// Football teams
const footballTeams = [
  'Manchester United', 'Liverpool', 'Chelsea', 'Arsenal', 'Manchester City',
  'Real Madrid', 'Barcelona', 'Bayern Munich', 'PSG', 'Juventus'
];

// Kabaddi teams
const kabaddiTeams = [
  'Patna Pirates', 'Bengaluru Bulls', 'U Mumba', 'Jaipur Pink Panthers',
  'Puneri Paltan', 'Bengal Warriors', 'Telugu Titans', 'Tamil Thalaivas'
];

// Generate cricket match data
const generateCricketMatch = (status = 'live', seriesId = null) => {
  const homeTeam = cricketTeams[Math.floor(Math.random() * cricketTeams.length)];
  let awayTeam = cricketTeams[Math.floor(Math.random() * cricketTeams.length)];
  while (awayTeam === homeTeam) {
    awayTeam = cricketTeams[Math.floor(Math.random() * cricketTeams.length)];
  }

  const now = new Date();
  let startsAt = now.getTime();
  
  if (status === 'upcoming') {
    startsAt = addHours(now, Math.floor(Math.random() * 48)).getTime();
  } else if (status === 'completed') {
    startsAt = subDays(now, Math.floor(Math.random() * 7)).getTime();
  }

  return {
    seriesId: seriesId || generateSeriesId(),
    status,
    teams: {
      home: homeTeam,
      away: awayTeam
    },
    scores: status === 'live' || status === 'completed' ? {
      home: {
        runs: Math.floor(Math.random() * 300) + 100,
        wickets: Math.floor(Math.random() * 10),
        overs: status === 'live' ? Math.floor(Math.random() * 40) + 10 : 50
      },
      away: {
        runs: Math.floor(Math.random() * 300) + 100,
        wickets: Math.floor(Math.random() * 10),
        overs: Math.floor(Math.random() * 50)
      }
    } : {},
    timeline: status === 'live' ? {
      currentOver: Math.floor(Math.random() * 40) + 10,
      currentBatsman: 'Player ' + Math.floor(Math.random() * 11 + 1),
      currentBowler: 'Bowler ' + Math.floor(Math.random() * 11 + 1),
      recentBalls: ['4', '1', 'W', '6', '2', '.']
    } : {},
    startsAt,
    updatedAt: now.getTime(),
    source: 'seed',
    visibility: 'public',
    venue: 'Stadium ' + Math.floor(Math.random() * 10 + 1),
    matchType: ['T20', 'ODI', 'Test'][Math.floor(Math.random() * 3)]
  };
};

// Generate football match data
const generateFootballMatch = (status = 'live', seriesId = null) => {
  const homeTeam = footballTeams[Math.floor(Math.random() * footballTeams.length)];
  let awayTeam = footballTeams[Math.floor(Math.random() * footballTeams.length)];
  while (awayTeam === homeTeam) {
    awayTeam = footballTeams[Math.floor(Math.random() * footballTeams.length)];
  }

  const now = new Date();
  let startsAt = now.getTime();
  
  if (status === 'upcoming') {
    startsAt = addHours(now, Math.floor(Math.random() * 48)).getTime();
  } else if (status === 'completed') {
    startsAt = subDays(now, Math.floor(Math.random() * 7)).getTime();
  }

  return {
    seriesId: seriesId || generateSeriesId(),
    status,
    teams: {
      home: homeTeam,
      away: awayTeam
    },
    scores: status === 'live' || status === 'completed' ? {
      home: {
        goals: Math.floor(Math.random() * 5)
      },
      away: {
        goals: Math.floor(Math.random() * 5)
      }
    } : {},
    timeline: status === 'live' ? {
      currentMinute: Math.floor(Math.random() * 90),
      possession: Math.random() > 0.5 ? 'home' : 'away',
      events: [
        { minute: 15, type: 'goal', team: 'home', player: 'Player 1' },
        { minute: 32, type: 'yellow', team: 'away', player: 'Player 2' }
      ]
    } : {},
    startsAt,
    updatedAt: now.getTime(),
    source: 'seed',
    visibility: 'public',
    venue: 'Stadium ' + Math.floor(Math.random() * 10 + 1),
    competition: ['Premier League', 'Champions League', 'La Liga'][Math.floor(Math.random() * 3)]
  };
};

// Generate series data
const generateSeries = (sport) => {
  const seriesTypes = {
    cricket: ['World Cup', 'IPL', 'Ashes', 'Champions Trophy', 'T20 World Cup'],
    football: ['Premier League', 'Champions League', 'World Cup', 'Euro Cup', 'Copa America'],
    kabaddi: ['Pro Kabaddi League', 'World Cup', 'Asian Games', 'National Championship']
  };

  const now = new Date();
  return {
    name: seriesTypes[sport][Math.floor(Math.random() * seriesTypes[sport].length)] + ' ' + new Date().getFullYear(),
    season: new Date().getFullYear().toString(),
    matches: {},
    startsAt: subDays(now, 10).getTime(),
    endsAt: addDays(now, 20).getTime(),
    description: `Exciting ${sport} tournament with top teams competing`,
    sport
  };
};

// Generate community post
const generatePost = (sport, authorId) => {
  const titles = [
    'Match Thread: Today\'s game discussion',
    'Post-match analysis and thoughts',
    'Team selection predictions',
    'Player performance discussion',
    'Tournament predictions and analysis',
    'Breaking news and updates',
    'Historical moments discussion',
    'Rules and regulations query'
  ];

  const content = [
    'What an amazing match! The way the team performed in the crucial moments was incredible.',
    'I think the team selection could have been better. What are your thoughts?',
    'This tournament is shaping up to be one of the best we\'ve seen in years.',
    'The new rules have really changed the dynamics of the game.',
    'Looking forward to tomorrow\'s match. Predictions?',
    'Historical performance suggests this could go either way.',
    'The upcoming series is going to be intense. Can\'t wait!',
    'Player form has been exceptional this season.'
  ];

  return {
    authorId,
    title: titles[Math.floor(Math.random() * titles.length)],
    content: content[Math.floor(Math.random() * content.length)],
    votes: Math.floor(Math.random() * 100),
    createdAt: subDays(new Date(), Math.random() * 30).getTime(),
    updatedAt: new Date().getTime(),
    deleted: false,
    reports: 0,
    sport,
    type: ['discussion', 'news', 'analysis'][Math.floor(Math.random() * 3)],
    tags: ['match-thread', 'analysis', 'news', 'discussion'].slice(0, Math.floor(Math.random() * 3) + 1)
  };
};

// Generate comment
const generateComment = (postId, authorId, parentId = null) => {
  const comments = [
    'Great point! I totally agree with this.',
    'I have a different perspective on this.',
    'This is exactly what I was thinking!',
    'Interesting analysis, thanks for sharing.',
    'Could you elaborate more on this point?',
    'I respectfully disagree. Here\'s why...',
    'Thanks for the insights!',
    'This needs more discussion.'
  ];

  return {
    postId,
    authorId,
    content: comments[Math.floor(Math.random() * comments.length)],
    parentId,
    createdAt: new Date().getTime(),
    deleted: false,
    votes: Math.floor(Math.random() * 50)
  };
};

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create test users
    console.log('Creating test users...');
    const users = [];
    
    // Create admin user
    try {
      const adminCred = await createUserWithEmailAndPassword(auth, 'admin@matcharena.com', 'admin123456');
      users.push({
        uid: adminCred.user.uid,
        email: 'admin@matcharena.com',
        role: 'admin'
      });
      console.log('✅ Admin user created');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        const adminCred = await signInWithEmailAndPassword(auth, 'admin@matcharena.com', 'admin123456');
        users.push({
          uid: adminCred.user.uid,
          email: 'admin@matcharena.com',
          role: 'admin'
        });
        console.log('✅ Admin user already exists, signed in');
      } else {
        throw error;
      }
    }

    // Create moderator user
    try {
      const modCred = await createUserWithEmailAndPassword(auth, 'mod@matcharena.com', 'mod123456');
      users.push({
        uid: modCred.user.uid,
        email: 'mod@matcharena.com',
        role: 'moderator'
      });
      console.log('✅ Moderator user created');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        const modCred = await signInWithEmailAndPassword(auth, 'mod@matcharena.com', 'mod123456');
        users.push({
          uid: modCred.user.uid,
          email: 'mod@matcharena.com',
          role: 'moderator'
        });
        console.log('✅ Moderator user already exists, signed in');
      } else {
        throw error;
      }
    }

    // Create regular users
    for (let i = 1; i <= 3; i++) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, `user${i}@matcharena.com`, 'user123456');
        users.push({
          uid: userCred.user.uid,
          email: `user${i}@matcharena.com`,
          role: 'user'
        });
        console.log(`✅ User ${i} created`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          const userCred = await signInWithEmailAndPassword(auth, `user${i}@matcharena.com`, 'user123456');
          users.push({
            uid: userCred.user.uid,
            email: `user${i}@matcharena.com`,
            role: 'user'
          });
          console.log(`✅ User ${i} already exists, signed in`);
        } else {
          throw error;
        }
      }
    }

    // Seed user profiles
    console.log('Creating user profiles...');
    for (const user of users) {
      await set(ref(db, `users/${user.uid}`), {
        displayName: user.role === 'admin' ? 'Admin User' : 
                     user.role === 'moderator' ? 'Moderator User' : 
                     `User ${user.email.split('@')[0]}`,
        photoURL: `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=random`,
        email: user.email,
        role: user.role,
        sports: {
          cricket: true,
          football: Math.random() > 0.3,
          kabaddi: Math.random() > 0.5
        },
        createdAt: new Date().getTime(),
        bio: `${user.role} account for MatchArena`,
        favoriteTeams: {
          cricket: cricketTeams[Math.floor(Math.random() * cricketTeams.length)],
          football: footballTeams[Math.floor(Math.random() * footballTeams.length)]
        }
      });
    }
    console.log('✅ User profiles created');

    // Seed series and matches
    console.log('Creating series and matches...');
    const sports = ['cricket', 'football', 'kabaddi'];
    
    for (const sport of sports) {
      // Create series
      for (let i = 0; i < 3; i++) {
        const seriesId = generateSeriesId();
        const series = generateSeries(sport);
        
        // Create matches for this series
        const matchIds = [];
        
        // Live matches
        for (let j = 0; j < 2; j++) {
          const matchId = generateMatchId();
          const match = sport === 'cricket' ? generateCricketMatch('live', seriesId) :
                       sport === 'football' ? generateFootballMatch('live', seriesId) :
                       generateCricketMatch('live', seriesId); // Use cricket for kabaddi placeholder
          
          await set(ref(db, `matches/${sport}/${matchId}`), match);
          matchIds.push(matchId);
        }
        
        // Upcoming matches
        for (let j = 0; j < 3; j++) {
          const matchId = generateMatchId();
          const match = sport === 'cricket' ? generateCricketMatch('upcoming', seriesId) :
                       sport === 'football' ? generateFootballMatch('upcoming', seriesId) :
                       generateCricketMatch('upcoming', seriesId);
          
          await set(ref(db, `matches/${sport}/${matchId}`), match);
          matchIds.push(matchId);
        }
        
        // Completed matches
        for (let j = 0; j < 2; j++) {
          const matchId = generateMatchId();
          const match = sport === 'cricket' ? generateCricketMatch('completed', seriesId) :
                       sport === 'football' ? generateFootballMatch('completed', seriesId) :
                       generateCricketMatch('completed', seriesId);
          
          await set(ref(db, `matches/${sport}/${matchId}`), match);
          matchIds.push(matchId);
        }
        
        // Add match IDs to series
        series.matches = matchIds.reduce((acc, id) => ({ ...acc, [id]: true }), {});
        await set(ref(db, `series/${sport}/${seriesId}`), series);
      }
      console.log(`✅ ${sport} series and matches created`);
    }

    // Seed community posts and comments
    console.log('Creating community posts and comments...');
    for (const sport of sports) {
      for (let i = 0; i < 5; i++) {
        const postId = generatePostId();
        const authorId = users[Math.floor(Math.random() * users.length)].uid;
        const post = generatePost(sport, authorId);
        
        await set(ref(db, `communities/${sport}/posts/${postId}`), post);
        
        // Add comments
        for (let j = 0; j < Math.floor(Math.random() * 5) + 1; j++) {
          const commentId = generateCommentId();
          const commentAuthorId = users[Math.floor(Math.random() * users.length)].uid;
          const comment = generateComment(postId, commentAuthorId);
          
          await set(ref(db, `communities/${sport}/comments/${commentId}`), comment);
        }
      }
      console.log(`✅ ${sport} community content created`);
    }

    // Seed notifications for users
    console.log('Creating sample notifications...');
    for (const user of users.slice(2)) { // Skip admin and mod
      for (let i = 0; i < 3; i++) {
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await set(ref(db, `notifications/${user.uid}/${notificationId}`), {
          type: ['comment', 'vote', 'system'][Math.floor(Math.random() * 3)],
          data: {
            message: 'Someone interacted with your post',
            link: '/community/cricket'
          },
          read: Math.random() > 0.5,
          createdAt: subDays(new Date(), Math.random() * 7).getTime()
        });
      }
    }
    console.log('✅ Notifications created');

    // Seed admin settings
    console.log('Creating admin settings...');
    await set(ref(db, 'admin/settings'), {
      maintenance: false,
      allowedSports: ['cricket', 'football', 'kabaddi'],
      rateLimits: {
        liveInterval: 1,
        upcomingInterval: 15
      },
      features: {
        communities: true,
        notifications: true,
        analytics: false
      }
    });
    console.log('✅ Admin settings created');

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📧 Test accounts:');
    console.log('  Admin: admin@matcharena.com / admin123456');
    console.log('  Moderator: mod@matcharena.com / mod123456');
    console.log('  Users: user1@matcharena.com / user123456');
    console.log('         user2@matcharena.com / user123456');
    console.log('         user3@matcharena.com / user123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
