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
  .then(() => console.log('Gateway service connected to Mongo'))
  .catch(err => {
    console.error('Mongo err', err && err.message ? err.message : err);
    // continue running for dev
  });



    app.get('/', (req, res) => res.json({ service: 'gateway-service', status: 'running' }));
    app.get('/health', (req, res) => res.json({ ok: true }));


const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Gateway service listening on ${PORT}`));
