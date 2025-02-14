require('dotenv').config();  // Load environment variables
console.log("🔍 MONGO_URI:", process.env.MONGO_URI); // Debugging

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());
app.use(session({
  secret: 'adminsecret',
  resave: false,
  saveUninitialized: true
}));

// 🔹 Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));


// 🔹 Define Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
  round: { type: String, required: true },
  data: [{ name: String, score: Number }]
});
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// 🔹 Get leaderboard data from MongoDB
app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboards = await Leaderboard.find();
    const leaderboardData = {};
    leaderboards.forEach(lb => {
      leaderboardData[lb.round] = lb.data;
    });

    console.log('📤 Sending Leaderboard Data:', JSON.stringify(leaderboardData, null, 2));
    res.json(leaderboardData);
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// 🔹 Update leaderboard (Admin Only)
app.post('/update-leaderboard', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { round, data } = req.body;

  if (!round || !data) {
    return res.status(400).json({ error: 'Invalid data format. Provide round and data.' });
  }

  try {
    const updatedLeaderboard = await Leaderboard.findOneAndUpdate(
      { round },
      { data: data.sort((a, b) => b.score - a.score) },
      { upsert: true, new: true }
    );

    console.log(`✅ Updated ${round}:`, updatedLeaderboard);
    res.json({ message: `${round} updated successfully!` });
  } catch (error) {
    console.error('❌ Error updating leaderboard:', error);
    res.status(500).json({ error: 'Failed to update leaderboard' });
  }
});

// 🔹 Admin Login
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 🔹 Admin Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// 🔹 Start Server
app.listen(PORT, () => console.log(`🏴‍☠️ Server running at http://localhost:${PORT}`));
