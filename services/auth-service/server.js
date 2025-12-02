// services/auth-service/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const { initKafka } = require('./lib/kafkaClient');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Auth service connected to Mongo'))
  .catch(err => {
    console.error('Mongo err', err && err.message ? err.message : err);
    // continue running for dev
  });

  initKafka().catch(()=>{});

app.get('/health', (req, res) => res.json({ ok: true }));

// mount auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const profileRoutes = require('./routes/profile');
const { verifyJWT } = require('./lib/authMiddleware');
app.use('/auth', verifyJWT, profileRoutes); // /auth/me protected

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Auth service listening on ${PORT}`));
