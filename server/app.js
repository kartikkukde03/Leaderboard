require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors({
  origin: "https://leaderboard-iota-one.vercel.app",
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

app.use(session({
  secret: process.env.SESSION_SECRET || 'leaderboardsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
    ttl: 24 * 60 * 60
  }),
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const leaderboardSchema = new mongoose.Schema({
  round: String,
  data: [{ name: String, score: Number }]
});
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

app.get('/leaderboard', async (req, res) => {
  const leaderboards = await Leaderboard.find();
  const leaderboardData = {};
  leaderboards.forEach(lb => leaderboardData[lb.round] = lb.data);
  res.json(leaderboardData);
});

app.post('/login', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.post('/update-leaderboard', async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
  await Leaderboard.findOneAndUpdate({ round: req.body.round }, req.body, { upsert: true });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🏴‍☠️ Server running on port ${PORT}`));
