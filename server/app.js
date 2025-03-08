require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// ✅ CORS Configuration
app.use(cors({
  origin: "https://leaderboard-iota-one.vercel.app", // Replace with your frontend URL
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Session Management
app.use(session({
  secret: process.env.SESSION_SECRET || 'leaderboardsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
    ttl: 24 * 60 * 60, // 24 Hours Session Expiry
    autoRemove: 'native'
  }),
  cookie: {
    httpOnly: true,
    secure: true, // Must be true on HTTPS
    sameSite: 'None' // Allows cross-site requests
  }
}));

// ✅ Middleware to Check Admin Authentication
async function isAuthenticated(req, res, next) {
  console.log("🔍 Checking session:", req.session);

  if (!req.session.isAdmin) {
    try {
      const session = await req.sessionStore.get(req.sessionID);
      if (session && session.isAdmin) {
        req.session.isAdmin = true;
        console.log("✅ Restored isAdmin from session store.");
        return next();
      }
    } catch (err) {
      console.error("❌ Error retrieving session:", err);
    }
    console.log("❌ Unauthorized access detected");
    return res.status(403).json({ error: 'Unauthorized. Please log in again.' });
  }

  console.log("✅ Admin authenticated");
  return next();
}

// ✅ Keep-Alive Route
app.get('/keep-alive', isAuthenticated, (req, res) => {
  res.json({ success: true, message: "Session active" });
});

// ✅ Fetch Leaderboard Data
app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboards = await Leaderboard.find();
    const leaderboardData = { round1: [], round2: [], round3: [] };

    leaderboards.forEach(lb => {
      leaderboardData[lb.round] = lb.data;
    });

    res.json(leaderboardData);
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ✅ Admin Login
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required' });
  }
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.save((err) => {
      if (err) {
        console.error("❌ Error saving session:", err);
        return res.status(500).json({ success: false, message: 'Session save failed' });
      }
      console.log("✅ Admin session started:", req.session);
      return res.json({ success: true, message: 'Login successful' });
    });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// ✅ Save Data
app.post('/update-leaderboard', isAuthenticated, async (req, res) => {
  console.log("🔍 Checking session for update-leaderboard:", req.session);
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
    console.log(`✅ ${round} updated successfully!`);
    res.json({ success: true, message: `${round} updated successfully!` });
  } catch (error) {
    console.error('❌ Error updating leaderboard:', error);
    res.status(500).json({ error: 'Failed to update leaderboard' });
  }
});

// ✅ Admin Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    console.log("✅ Admin logged out");
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🏴‍☠️ Server running on port ${PORT}`));
