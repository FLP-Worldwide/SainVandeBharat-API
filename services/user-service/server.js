// services/auth-service/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MONGO = process.env.MONGO_URI;
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('user service connected to Mongo'))
  .catch(err => {
    console.error('Mongo err', err && err.message ? err.message : err);
    // continue running for dev
  });


app.get('/', (req, res) => res.json({ service: 'user-service', status: 'running' }));
app.get('/health', (req, res) => res.json({ ok: true, service: 'user-service', status: 'running' }));

const userRoutes = require('./routes/userProfile');
const { verifyJWT } = require('../../shared/lib/authMiddleware');

app.use('/user', verifyJWT, userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`User service listening on ${PORT}`));
