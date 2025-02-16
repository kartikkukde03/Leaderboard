require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// ✅ Fix: CORS Configuration (Allows Frontend Access)
app.use(cors({
  origin: "https://leaderboard-iota-one.vercel.app", // Your Frontend URL
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// ✅ Fix: MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Fix: Session Management (Ensures Login Stays Active)
app.use(session({
  secret: process.env.SESSION_SECRET || 'leaderboardsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
    ttl: 24 * 60 * 60 // 24 Hours Session Expiry
  }),
  cookie: {
    httpOnly: true,
    secure: false, // Set to `true` if using HTTPS
    sameSite: 'Lax'
  }
}));

// ✅ Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
  round: String,
  data: [{ name: String, score: Number }]
});
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// ✅ Keep-Alive Route (Prevents Unauthorized Logout)
app.get('/keep-alive', (req, res) => {
  if (req.session.isAdmin) {
    res.json({ success: true, message: "Session active" });
  } else {
    res.status(403).json({ success: false, message: "Session expired" });
  }
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

// ✅ Fix: Admin Login (Ensures Session Works)
app.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required' });
  }

  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.save(() => {
      return res.json({ success: true, message: 'Login successful' });
    });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// ✅ Fix: Save Data (Prevent Unauthorized Error)
app.post('/update-leaderboard', async (req, res) => {
  console.log("🔍 Checking session for update-leaderboard...");
  
  if (!req.session.isAdmin) {
    console.log("❌ Unauthorized access detected.");
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

    res.json({ success: true, message: `${round} updated successfully!` });
  } catch (error) {
    console.error('❌ Error updating leaderboard:', error);
    res.status(500).json({ error: 'Failed to update leaderboard' });
  }
});

// ✅ Admin Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out successfully' });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🏴‍☠️ Server running on port ${PORT}`));
