// routes/poses.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Pose = require('../models/Pose');
const mongoose = require('mongoose');

// Get all public poses
router.get('/', async (req, res) => {
  try {
    const poses = await Pose.find({ public: true })
      .populate('creator', 'name email')
      .sort({ created_at: -1 });
    
    res.json(poses);
  } catch (error) {
    console.error('Error fetching poses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific pose
router.get('/:poseId', async (req, res) => {
  try {
    const { poseId } = req.params;
    
    const pose = await Pose.findById(poseId)
      .populate('creator', 'name email');
    
    if (!pose) {
      return res.status(404).json({ message: 'Pose not found' });
    }
    
    res.json(pose);
  } catch (error) {
    console.error('Error fetching pose:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new pose
router.post('/', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { name, drawn_file, public = true, tags = [] } = req.body;
    
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const pose = new Pose({
      name,
      creator: user._id,
      drawn_file,
      public,
      tags
    });
    
    await pose.save();
    
    // Add to user's poses_made array
    user.poses_made.push(pose._id);
    await user.save();
    
    res.status(201).json(pose);
  } catch (error) {
    console.error('Error creating pose:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete a pose
router.post('/:poseId/complete', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { poseId } = req.params;
    
    // Start a session to ensure atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const user = await User.findOne({ auth0Id }).session(session);
      
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }
      
      const pose = await Pose.findById(poseId).session(session);
      
      if (!pose) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Pose not found' });
      }
      
      // Check if user already completed this pose
      const alreadyCompleted = user.poses_done.some(p => p.pose_id.equals(poseId));
      
      if (!alreadyCompleted) {
        // Add to user's poses_done array
        user.poses_done.push({ pose_id: poseId });
        await user.save({ session });
        
        // Increment pose completion count
        pose.completion_count += 1;
        await pose.save({ session });
        
        // Notify pose creator if it's not the user themselves
        if (!pose.creator.equals(user._id)) {
          const creator = await User.findById(pose.creator).session(session);
          
          creator.notifications.push({
            type: 'pose_completed',
            pose_id: pose._id,
            user_id: user._id,
            message: `${user.name} completed your pose "${pose.name}"`
          });
          
          await creator.save({ session });
        }
      }
      
      await session.commitTransaction();
      res.json({ message: 'Pose completed successfully' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error completing pose:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's created poses
router.get('/user/created', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const poses = await Pose.find({ _id: { $in: user.poses_made } })
      .sort({ created_at: -1 });
    
    res.json(poses);
  } catch (error) {
    console.error('Error fetching created poses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's completed poses
router.get('/user/completed', async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const poseIds = user.poses_done.map(p => p.pose_id);
    
    const poses = await Pose.find({ _id: { $in: poseIds } })
      .populate('creator', 'name')
      .sort({ created_at: -1 });
    
    res.json(poses);
  } catch (error) {
    console.error('Error fetching completed poses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;