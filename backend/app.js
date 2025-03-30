const express = require('express');
const app = express();
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');

const port = process.env.PORT || 8080;

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
    audience: 'https://pixel-pose-api.com',
    issuerBaseURL: 'https://pixel-pose.us.auth0.com/',
    tokenSigningAlg: 'RS256',
});

// enforce on all endpoints
// app.use(jwtCheck);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.get('/authorized', function (req, res) {
    res.send('Secured Resource');
});

app.listen(port);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Everything went well!' });
    console.log("AHHHHHHHHHHHHHHH");
  });

// This route doesn't need authentication
app.get('/api/public', function (req, res) {
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
});

// This route needs authentication
app.get('/api/private', checkJwt, function (req, res) {
    console.log("someone is in private")
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated to see this.'
    });
});

const checkScopes = requiredScopes('read:messages');

app.get('/api/private-scoped', checkJwt, checkScopes, function (req, res) {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.'
    });
});