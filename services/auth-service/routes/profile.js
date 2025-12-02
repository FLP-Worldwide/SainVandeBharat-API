// services/auth-service/routes/profile.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const getUserModel = require('../../../shared/lib/models/user');
const getUserDetailsModel = require('../../../shared/lib/models/userDetails');
const redis = require('../lib/redisClient');
const { publishUserUpdated } = require('../lib/kafkaClient'); // best-effort

const CACHE_TTL = 60 * 5; // 5 minutes cache for user profile
const CACHE_KEY = (userId) => `user:profile:${userId}`;

/**
 * GET /auth/me
 * Requires Authorization: Bearer <token>
 * Returns combined user + details (cached)
 */
router.get('/me', async (req, res) => {
  try {
    if (!req.auth || !req.auth.sub) return res.status(401).json({ error: 'unauthorized' });
    const userId = req.auth.sub;

    // Try Redis cache
    const cache = await redis.get(CACHE_KEY(userId));
    if (cache) {
      const payload = JSON.parse(cache);
      payload._cached = true;
      return res.json(payload);
    }

    // Fetch from DB
    const User = getUserModel(mongoose);
    const UserDetails = getUserDetailsModel(mongoose);

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const details = await UserDetails.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
    const result = { user, details };

    // Store in cache
    try {
      await redis.setex(CACHE_KEY(userId), CACHE_TTL, JSON.stringify(result));
    } catch (e) {
      console.warn('redis setex failed', e && e.message ? e.message : e);
    }

    // publish a lightweight "user.fetched" or "user.view" if desired
    // publishUserUpdated({ userId, event: 'profile.fetched', ts: Date.now() }).catch(()=>{});

    return res.json(result);
  } catch (e) {
    console.error('GET /auth/me err', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

/**
 * GET /users/:id
 * Public or internal read (no JWT required) — useful for other services
 * Does caching similarly.
 */
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const cache = await redis.get(CACHE_KEY(userId));
    if (cache) {
      const payload = JSON.parse(cache);
      payload._cached = true;
      return res.json(payload);
    }

    const User = getUserModel(mongoose);
    const UserDetails = getUserDetailsModel(mongoose);

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const details = await UserDetails.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
    const result = { user, details };
    await redis.setex(CACHE_KEY(userId), CACHE_TTL, JSON.stringify(result));

    return res.json(result);
  } catch (e) {
    console.error('GET /users/:id err', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
