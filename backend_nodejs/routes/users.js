// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    
    // Find user
    let user = await User.findOne({ auth0Id });
    
    if (!user) {
      // For a Google OAuth user, sub will look like: google-oauth2|123456789
      const provider = auth0Id.split('|')[0];
      const providerUserId = auth0Id.split('|')[1];
      
      // Create a placeholder email
      const email = `${providerUserId}@example.com`;
      
      // Create a placeholder name from the provider
      const name = auth0Id;
      
      console.log(`Creating new user with auth0Id: ${auth0Id}`);
      
      user = new User({
        auth0Id,
        name,
        email,
        poses_done: [],
        poses_made: [],
        friends: [],
        notifications: []
      });
      
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/me', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { name, email } = req.body;
    
    // Validate input
    if (!name && !email) {
      return res.status(400).json({ message: 'At least one field (name or email) is required' });
    }
    
    // Build update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    const user = await User.findOneAndUpdate(
      { auth0Id },
      updateData,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's friends
router.get('/me/friends', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    
    const user = await User.findOne({ auth0Id })
      .populate({
        path: 'friends.user_id',
        select: 'name email'
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a friend
router.post('/me/friends', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { friendUserId } = req.body;
    
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if friend exists
    const friend = await User.findById(friendUserId);
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }
    
    // Check if already friends
    const isAlreadyFriend = user.friends.some(f => f.user_id.equals(friendUserId));
    if (isAlreadyFriend) {
      return res.status(400).json({ message: 'Already friends' });
    }
    
    // Add friend to user's friends list
    user.friends.push({ user_id: friendUserId });
    await user.save();
    
    // Add user to friend's friends list
    friend.friends.push({ user_id: user._id });
    await friend.save();
    
    // Add notification for the friend
    friend.notifications.push({
      type: 'friend_request',
      user_id: user._id,
      message: `${user.name} added you as a friend`
    });
    await friend.save();
    
    res.json(user.friends);
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's notifications
router.get('/me/notifications', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    
    const user = await User.findOne({ auth0Id })
      .populate('notifications.user_id', 'name email')
      .populate('notifications.pose_id', 'name');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a bump notification endpoint
router.post('/users/:userId/bump', async (req, res) => {
    try {
      const { userId } = req.params; // ID of the friend to notify
      const auth0Id = req.auth.payload.sub; // Current user's Auth0 ID
      
      // Get the current user's info
      const user = await User.findOne({ auth0Id });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Find the friend to notify
      const friend = await User.findById(userId);
      
      if (!friend) {
        return res.status(404).json({ message: 'Friend not found' });
      }
      
      // Add bump notification to friend's notifications array
      friend.notifications.push({
        type: 'bump',
        user_id: user._id,
        message: `${user.name} bumped you!`,
        read: false,
        created_at: new Date()
      });
      
      await friend.save();
      
      res.status(200).json({ message: 'Bump notification sent' });
    } catch (error) {
      console.error('Error sending bump notification:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Mark notification as read
router.put('/me/notifications/:notificationId', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { notificationId } = req.params;
    
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const notification = user.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.read = true;
    await user.save();
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// In routes/users.js
// In routes/users.js
// In routes/users.js
router.post('/notify', async (req, res) => {
    try {
      const auth0Id = req.auth.payload.sub;
      const { recipientId, type, message } = req.body;
      
      // Get current user
      const sender = await User.findOne({ auth0Id });
      
      if (!sender) {
        return res.status(404).json({ message: 'Sender not found' });
      }
      
      // Get recipient
      const recipient = await User.findById(recipientId);
      
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      
      // Add notification to recipient's notifications array
      recipient.notifications.push({
        type,
        user_id: sender._id,
        message,
        read: false,
        created_at: new Date()
      });
      
      await recipient.save();
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Add a bump to a friend
router.post('/me/bump-friend', async (req, res) => {
    try {
      const auth0Id = req.auth.payload.sub;
      const { friendUserId } = req.body;
      
      const user = await User.findOne({ auth0Id });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if friend exists
      const friend = await User.findById(friendUserId);
      if (!friend) {
        return res.status(404).json({ message: 'Friend not found' });
      }
      
      // Add bump notification for the friend
      friend.notifications.push({
        type: 'bump',
        user_id: user._id,
        message: `${user.name} bumped you!`
      });
      await friend.save();
      
      res.status(200).json({ message: 'Bump notification sent' });
    } catch (error) {
      console.error('Error sending bump:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });



module.exports = router;