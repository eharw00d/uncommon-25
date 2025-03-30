const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
    origin: 'http://localhost:3000',  // Explicitly set the frontend URL
    credentials: true  // Allow credentials (cookies) to be sent
}));

// Auth0 JWT authentication middleware
const checkJwt = auth({
    audience: 'https://pixel-pose-api.com',
    issuerBaseURL: 'https://pixel-pose.us.auth0.com/',
    tokenSigningAlg: 'RS256',
});

// Middleware
app.use(bodyParser.json());
app.use(express.json());

// API Endpoints
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Everything went well!' });
    console.log("AHHHHHHHHHHHHHHH");
});

app.get('/authorized', (req, res) => {
    res.send('Secured Resource');
});

app.get('/api/public', (req, res) => {
    res.json({ message: "Hello from a public endpoint! You don't need to be authenticated to see this." });
});

app.get('/api/private', checkJwt, (req, res) => {
    console.log("someone is in private");
    res.json({ message: "Hello from a private endpoint! You need to be authenticated to see this." });
});

const checkScopes = requiredScopes('read:messages');

app.get('/api/private-scoped', checkJwt, checkScopes, (req, res) => {
    res.json({ message: "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this." });
});

const posesFilePath = "../react_frontend/my-app/Grid/poses.json";

app.post('/save-pose', checkJwt, (req, res) => {
    const { drawnPose } = req.body;

    if (!drawnPose) {
        return res.status(400).json({ error: "No pose data received" });
    }

    // Read existing poses
    fs.readFile(posesFilePath, "utf8", (err, data) => {
        let poses = [];
        if (!err && data) {
            try {
                poses = JSON.parse(data);
            } catch (parseErr) {
                console.error("Error parsing JSON:", parseErr);
            }
        }

        poses.push(drawnPose); // Append new pose

        // Write back to file
        fs.writeFile(posesFilePath, JSON.stringify(poses, null, 2), (writeErr) => {
            if (writeErr) {
                console.error("Failed to save pose:", writeErr);
                return res.status(500).json({ error: "Failed to save pose" });
            }
            res.json({ message: "Pose saved successfully!" });
        });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});