const admin = require('firebase-admin');
const logger = require('./utils/logger');

// Send match status notification
async function sendMatchStatusNotification(sport, matchId, oldStatus, newStatus) {
  const db = admin.database();
  
  try {
    // Get match details
    const matchSnapshot = await db.ref(`matches/${sport}/${matchId}`).once('value');
    const match = matchSnapshot.val();
    
    if (!match) {
      logger.warn(`Match not found: ${sport}/${matchId}`);
      return;
    }

    // Get users following this match
    const followersSnapshot = await db.ref('userFollows').once('value');
    const followers = followersSnapshot.val() || {};
    
    const notifications = [];
    
    for (const [userId, userFollows] of Object.entries(followers)) {
      if (userFollows.matches && userFollows.matches[matchId]) {
        // Create notification based on status change
        let title, body, priority;
        
        if (newStatus === 'live' && oldStatus === 'upcoming') {
          title = 'Match Started!';
          body = `${match.homeTeam} vs ${match.awayTeam} has started`;
          priority = 'high';
        } else if (newStatus === 'completed') {
          title = 'Match Completed';
          body = `${match.homeTeam} vs ${match.awayTeam} has ended. ${match.result || ''}`;
          priority = 'normal';
        } else {
          continue;
        }
        
        const notification = {
          userId,
          type: 'match_status',
          title,
          body,
          data: {
            sport,
            matchId,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            status: newStatus,
          },
          priority,
          createdAt: admin.database.ServerValue.TIMESTAMP,
          read: false,
        };
        
        notifications.push(notification);
        
        // Save notification to database
        await db.ref(`notifications/${userId}`).push(notification);
        
        // Send push notification if user has FCM token
        await sendPushNotification(userId, title, body, { sport, matchId });
      }
    }
    
    logger.info(`Sent ${notifications.length} notifications for match ${matchId} status change`);
    return { success: true, count: notifications.length };
  } catch (error) {
    logger.error('Error sending match status notifications:', error);
    throw error;
  }
}

// Send push notification to user
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    // Get user's FCM tokens
    const tokensSnapshot = await admin.database()
      .ref(`users/${userId}/fcmTokens`)
      .once('value');
    
    const tokens = tokensSnapshot.val();
    
    if (!tokens) {
      logger.debug(`No FCM tokens for user ${userId}`);
      return;
    }
    
    const tokensList = Object.keys(tokens);
    
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: Date.now().toString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'match_updates',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      tokens: tokensList,
    };
    
    const response = await admin.messaging().sendMulticast(message);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && 
            (resp.error.code === 'messaging/invalid-registration-token' ||
             resp.error.code === 'messaging/registration-token-not-registered')) {
          tokensToRemove.push(tokensList[idx]);
        }
      });
      
      // Remove invalid tokens
      for (const token of tokensToRemove) {
        await admin.database()
          .ref(`users/${userId}/fcmTokens/${token}`)
          .remove();
      }
    }
    
    logger.debug(`Push notification sent to user ${userId}: ${response.successCount} successful, ${response.failureCount} failed`);
  } catch (error) {
    logger.error(`Error sending push notification to user ${userId}:`, error);
  }
}

// Send welcome email to new user
async function sendWelcomeEmail(user) {
  try {
    // In production, this would use an email service like SendGrid
    const emailData = {
      to: user.email,
      subject: 'Welcome to MatchArena!',
      template: 'welcome',
      data: {
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
      },
    };
    
    // Log email send (in production, would actually send)
    logger.info(`Welcome email sent to ${user.email}`);
    
    // Also create an in-app notification
    const notification = {
      type: 'system',
      title: 'Welcome to MatchArena!',
      body: 'Thank you for joining. Explore live matches, join the community, and never miss a moment!',
      priority: 'normal',
      createdAt: admin.database.ServerValue.TIMESTAMP,
      read: false,
    };
    
    await admin.database()
      .ref(`notifications/${user.uid}`)
      .push(notification);
    
    return { success: true };
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    throw error;
  }
}

// Send notification for new comment
async function sendCommentNotification(parentType, parentId, comment) {
  const db = admin.database();
  
  try {
    let parentAuthorId, title, body;
    
    if (parentType === 'posts') {
      // Get post author
      const postSnapshot = await db.ref(`community/posts/${parentId}`).once('value');
      const post = postSnapshot.val();
      
      if (!post || post.userId === comment.userId) {
        return; // Don't notify if commenting on own post
      }
      
      parentAuthorId = post.userId;
      title = 'New comment on your post';
      body = `${comment.userName} commented: "${comment.text.substring(0, 50)}..."`;
    } else if (parentType === 'matches') {
      // For match comments, notify all followers
      return sendMatchCommentNotifications(parentId, comment);
    }
    
    if (parentAuthorId) {
      const notification = {
        type: 'comment',
        title,
        body,
        data: {
          parentType,
          parentId,
          commentId: comment.id,
          commentAuthor: comment.userName,
        },
        priority: 'normal',
        createdAt: admin.database.ServerValue.TIMESTAMP,
        read: false,
      };
      
      await db.ref(`notifications/${parentAuthorId}`).push(notification);
      await sendPushNotification(parentAuthorId, title, body, notification.data);
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error sending comment notification:', error);
    throw error;
  }
}

// Send notifications to match followers about new comment
async function sendMatchCommentNotifications(matchId, comment) {
  const db = admin.database();
  
  try {
    // Get match details
    const matchSnapshot = await db.ref(`matches`).once('value');
    let match = null;
    let sport = null;
    
    // Find the match across all sports
    const matches = matchSnapshot.val() || {};
    for (const [s, sportMatches] of Object.entries(matches)) {
      if (sportMatches[matchId]) {
        match = sportMatches[matchId];
        sport = s;
        break;
      }
    }
    
    if (!match) return;
    
    // Get users following this match
    const followersSnapshot = await db.ref('userFollows').once('value');
    const followers = followersSnapshot.val() || {};
    
    const notifications = [];
    
    for (const [userId, userFollows] of Object.entries(followers)) {
      if (userFollows.matches && userFollows.matches[matchId] && userId !== comment.userId) {
        const notification = {
          userId,
          type: 'match_comment',
          title: 'New comment on followed match',
          body: `${comment.userName} commented on ${match.homeTeam} vs ${match.awayTeam}`,
          data: {
            sport,
            matchId,
            commentId: comment.id,
          },
          priority: 'low',
          createdAt: admin.database.ServerValue.TIMESTAMP,
          read: false,
        };
        
        notifications.push(db.ref(`notifications/${userId}`).push(notification));
      }
    }
    
    await Promise.all(notifications);
    logger.info(`Sent ${notifications.length} notifications for match comment`);
    
    return { success: true, count: notifications.length };
  } catch (error) {
    logger.error('Error sending match comment notifications:', error);
    throw error;
  }
}

// Send daily digest
async function sendDailyDigest(userId) {
  const db = admin.database();
  
  try {
    // Get user preferences
    const userSnapshot = await db.ref(`users/${userId}`).once('value');
    const user = userSnapshot.val();
    
    if (!user || !user.settings?.notifications?.dailyDigest) {
      return;
    }
    
    // Gather today's matches for user's favorite sports
    const matches = [];
    for (const sport of user.favoriteSports || []) {
      const sportMatchesSnapshot = await db.ref(`matches/${sport}`)
        .orderByChild('startTime')
        .startAt(Date.now())
        .endAt(Date.now() + 24 * 60 * 60 * 1000)
        .once('value');
      
      const sportMatches = sportMatchesSnapshot.val() || {};
      matches.push(...Object.values(sportMatches));
    }
    
    if (matches.length === 0) {
      return;
    }
    
    const notification = {
      type: 'daily_digest',
      title: `${matches.length} matches today in your favorite sports`,
      body: 'Check out today\'s exciting lineup!',
      data: {
        matchCount: matches.length,
        sports: user.favoriteSports,
      },
      priority: 'normal',
      createdAt: admin.database.ServerValue.TIMESTAMP,
      read: false,
    };
    
    await db.ref(`notifications/${userId}`).push(notification);
    
    return { success: true };
  } catch (error) {
    logger.error('Error sending daily digest:', error);
    throw error;
  }
}

module.exports = {
  sendMatchStatusNotification,
  sendPushNotification,
  sendWelcomeEmail,
  sendCommentNotification,
  sendMatchCommentNotifications,
  sendDailyDigest,
};
