// utils/auth0.js
const { ManagementClient } = require('auth0');
require('dotenv').config();

// Initialize Auth0 Management API client
const auth0ManagementClient = new ManagementClient({
  domain: 'pixel-pose.us.auth0.com',
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  scope: 'read:users update:users'
});

module.exports = { auth0ManagementClient };
