// models/Pose.js
const mongoose = require('mongoose');

const poseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  drawn_file: {
    type: String,  // Store the file path or URL
    required: true
  },
  completion_count: {
    type: Number,
    default: 0
  },
  public: {
    type: Boolean,
    default: true
  },
  tags: [String],
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
poseSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Pose', poseSchema);