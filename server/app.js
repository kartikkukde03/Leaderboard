require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Allow cross-origin requests
app.use(express.static('public')); // Serve static frontend files

// ✅ Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Stop server if MongoDB fails
  });

// ✅ Session Handling (Store Sessions in MongoDB)
app.use(session({
  secret: process.env.SESSION_SECRET || 'leaderboardsecret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,  // Store sessions in MongoDB
    collectionName: "sessions",
    ttl: 60 * 60 * 24  // Sessions expire in 24 hours
  })
}));

// ✅ Define Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
  round: { type: String, required: true },
  data: [{ name: String, score: Number }]
});
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// ✅ GET: Fetch Leaderboard Data
app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboards = await Leaderboard.find();
    const leaderboardData = {};
    leaderboards.forEach(lb => {
      leaderboardData[lb.round] = lb.data;
    });

    res.json(leaderboardData);
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ✅ POST: Update Leaderboard Data (Admin Only)
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
      { data: data.sort((a, b) => b.score - a.score) }, // Sort by score (descending)
      { upsert: true, new: true }
    );

    res.json({ message: `${round} updated successfully!` });
  } catch (error) {
    console.error('❌ Error updating leaderboard:', error);
    res.status(500).json({ error: 'Failed to update leaderboard' });
  }
});

// ✅ POST: Admin Login
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// ✅ GET: Admin Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ✅ Start Server

app.listen(PORT, () => console.log(`🏴‍☠️ Server running on port ${PORT}`));
