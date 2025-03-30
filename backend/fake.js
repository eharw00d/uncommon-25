const express = require('express');
const app = express();
const PORT = 8080;
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');


app.use(express.json());

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
    audience: 'https://pixel-pose-api.com',
    issuerBaseURL: 'https://pixel-pose.us.auth0.com/',
    tokenSigningAlg: 'RS256',
});

// CORS middleware
app.use((req, res, next) => {
    /*----- Chat GPT*/
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');  // Allow React app
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);  // Preflight response
  }

  next();
  /*--------------------------------*/
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'CORS-enabled server' });
  console.log("AHHHHHHHHHHHHHHH");
});

// This route needs authentication
app.get('/api/private', checkJwt, (req, res) => {
    console.log("someone is in private")
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated to see this.'
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
