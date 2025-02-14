require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// ✅ Fix CORS Issues (Ensures cookies & authentication work)
app.use(cors({
  origin: "https://leaderboard-iota-one.vercel.app", // Replace with your actual frontend URL
  credentials: true, // Ensures cookies are sent
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"] // ✅ Ensures browser receives session cookies
}));

// ✅ Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// ✅ Connect to MongoDB Atlas (Fixes Deprecation Warnings)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Session Management (Fixes Admin Login Persistence)
app.use(session({
  secret: process.env.SESSION_SECRET || 'leaderboardsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
    ttl: 24 * 60 * 60 // Sessions expire after 24 hours
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure only in production
    sameSite: "None",
    maxAge: 24 * 60 * 60 * 1000 // 1-day session expiration
  }
}));

// ✅ Define MongoDB Schema
const leaderboardSchema = new mongoose.Schema({
  round: String,
  data: [{ name: String, score: Number }]
});
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// ✅ Check if Admin is Logged In (Prevents Unauthorized Access)
app.get('/check-session', (req, res) => {
  if (req.session.isAdmin) {
    res.json({ isAdmin: true });
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
});

// ✅ Get Leaderboard Data
app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboards = await Leaderboard.find();
    if (!leaderboards || leaderboards.length === 0) {
      return res.json({ message: "No data available ☠️", data: {} });
    }

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

// ✅ Admin Login Route (Stores Session Properly)
app.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required' });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true, message: 'Login successful' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// ✅ Admin Logout Route (Destroys Session)
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out successfully' });
});

// ✅ Update Leaderboard (Admin Only, Fixes Unauthorized Errors)
app.post('/update-leaderboard', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { round, data } = req.body;

  if (!round || !data) {
    return res.status(400).json({ error: 'Invalid data format. Provide round and data.' });
  }

  try {
    await Leaderboard.findOneAndUpdate(
      { round },
      { round, data },
      { upsert: true, new: true }
    );

    console.log(`✅ Updated ${round}:`, data);
    res.json({ success: true, message: `${round} updated successfully!` }); // ✅ Always return message
  } catch (error) {
    console.error('❌ Error updating leaderboard:', error);
    res.status(500).json({ error: 'Failed to update leaderboard' });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🏴‍☠️ Server running on port ${PORT}`));
