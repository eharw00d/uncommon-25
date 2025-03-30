// server.js - Main entry point
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { auth } = require('express-oauth2-jwt-bearer');
require('dotenv').config();
const serverless = require('serverless-http');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Auth0 middleware for securing endpoints
const checkJwt = auth({
  audience: 'https://pixel-pose.us.auth0.com/api/v2/',
  issuerBaseURL: 'https://pixel-pose.us.auth0.com/',
  tokenSigningAlg: 'RS256'
});

// Error handling middleware for auth errors
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token, or no token supplied' });
  }
  
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error' });
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: "It's all good" });
});  

module.exports.handler = serverless(app);


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const userRoutes = require('./routes/users');
const poseRoutes = require('./routes/poses');

app.use('/api/users', checkJwt, userRoutes);
app.use('/api/poses', checkJwt, poseRoutes);

// Simple health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Simple health check endpoint (no auth required)
app.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', message: "It's all good" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});