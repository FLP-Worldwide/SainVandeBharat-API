// services/auth-service/lib/redisClient.js
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(REDIS_URL);

// basic error logging
redis.on('error', (err) => {
  console.error('Redis error', err && err.message ? err.message : err);
});

module.exports = redis;
