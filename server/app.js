const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

// Session handling for admin authentication
app.use(session({
  secret: 'adminsecret',
  resave: false,
  saveUninitialized: true
}));

// Dummy leaderboard data (in-memory) for three rounds
let leaderboardData = {
  round1: [
    { name: 'Captain Blackbeard', score: 95 },
    { name: 'Long John Silver', score: 88 },
    { name: 'Anne Bonny', score: 72 }
  ],
  round2: [
    { name: 'Jack Sparrow', score: 85 },
    { name: 'Barbossa', score: 80 },
    { name: 'Mary Read', score: 70 }
  ],
  round3: [
    { name: 'Redbeard', score: 90 },
    { name: 'Calico Jack', score: 84 },
    { name: 'Davy Jones', score: 78 }
  ]
};

// Route to get leaderboard data for users
app.get('/leaderboard', (req, res) => {
  console.log('Sending Leaderboard Data:', JSON.stringify(leaderboardData, null, 2)); // Debugging log
  res.json(leaderboardData);
});

// Route to update a specific round's leaderboard (Admin only)
app.post('/update-leaderboard', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { round, data } = req.body;

  console.log(`Received update request for ${round}:`, JSON.stringify(data, null, 2)); // Debugging log

  if (!round || !data) {
    console.log('Error: Missing round or data!');
    return res.status(400).json({ error: 'Invalid data format. Provide round and data.' });
  }

  if (!leaderboardData[round]) {
    console.log('Error: Invalid round name!', round);
    return res.status(400).json({ error: 'Invalid round name. Must be round1, round2, or round3.' });
  }

  // Sort and update only the specified round
  leaderboardData[round] = data.sort((a, b) => b.score - a.score);

  console.log(`Updated ${round}:`, leaderboardData[round]); // Debugging log

  res.json({ message: `${round} updated successfully!`, leaderboard: leaderboardData });
});

// Admin login route
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Admin logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Start server
app.listen(PORT, () => console.log(`🏴‍☠️ Server running at http://localhost:${PORT}`));
