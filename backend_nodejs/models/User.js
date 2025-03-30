// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  poses_done: [{
    pose_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pose'
    },
    completed_at: {
      type: Date,
      default: Date.now
    }
  }],
  poses_made: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pose'
  }],
  friends: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    added_at: {
      type: Date,
      default: Date.now
    }
  }],
  notifications: [{
    pose_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pose'
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['friend_request', 'pose_completed', 'pose_shared', 'bump', 'other'],
      required: true
    },
    message: String,
    read: {
      type: Boolean,
      default: false
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updated_at' field on save
userSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);