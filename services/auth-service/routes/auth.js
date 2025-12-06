// services/auth-service/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const getUserModel = require('../../../shared/lib/models/user');
const getUserDetailsModel = require('../../../shared/lib/models/userDetails');

const redisClient = require('../lib/redisClient'); // existing helper
const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const OTP_RATE_KEY = (phone) => `otp:reqcount:${phone}`;
const OTP_KEY = (phone) => `otp:${phone}`;
const VERIFIED_KEY_BY_PHONE = (phone) => `verified:phone:${phone}`; // value = userId
const VERIFIED_KEY_BY_USER = (userId) => `verified:user:${userId}`; // same value, helpful

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES = '7d';
const VERIFIED_TTL = 24 * 60 * 60; // 24 hours for completing profile

// helper: gen 6-digit OTP
function genOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// helper: gen 6-char alphanumeric referral code
function genReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ensure unique referralCode (checks userDetails collection)
async function createUniqueReferralCode(UserDetails) {
  for (let i = 0; i < 6; i++) { // try up to 6 times
    const code = genReferralCode();
    const exists = await UserDetails.findOne({ referralCode: code }).lean();
    if (!exists) return code;
  }
  // fallback: use ObjectId substring
  return (new mongoose.Types.ObjectId()).toString().slice(-6);
}

// POST /auth/login  -> { phone }
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    // simple rate limit: allow max 5 OTP requests per hour
    const reqCount = await redisClient.get(OTP_RATE_KEY(phone));
    if (reqCount && parseInt(reqCount, 10) >= 5) {
      return res.status(429).json({ error: 'too_many_requests', message: 'Try later' });
    }

    const otp = genOTP();
    await redisClient.setex(OTP_KEY(phone), OTP_TTL_SECONDS, otp);

    // increment request counter with 1 hour TTL
    await redisClient.incr(OTP_RATE_KEY(phone));
    await redisClient.expire(OTP_RATE_KEY(phone), 60 * 60);

    // IMPORTANT: in prod, send OTP via SMS provider. For dev we return it.
    return res.json({ success: true, message: 'otp_sent', otp }); // remove otp in prod
  } catch (e) {
    console.error('login err', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

// POST /auth/verify -> { phone, otp }
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'phone and otp required' });

    const savedOtp = await redisClient.get(OTP_KEY(phone));
    if (!savedOtp) return res.status(410).json({ error: 'otp_expired' });
    if (savedOtp !== otp) return res.status(401).json({ error: 'invalid_otp' });

    // OTP valid — delete OTP (we mark verification separately)
    await redisClient.del(OTP_KEY(phone));

    // initialize models
    const User = getUserModel(mongoose);
    const UserDetails = getUserDetailsModel(mongoose);

    // find existing user by phone
    let user = await User.findOne({ phone }).lean();
    if (user) {
      // check whether user details are complete
      const details = await UserDetails.findOne({ userId: new mongoose.Types.ObjectId(user._id) }).lean();

      // required fields to consider profile "complete"
      const requiredFields = ['name', 'city', 'dob', 'maritalStatus', 'occupation'];
      const missing = requiredFields.filter(f => {
        if (!details) return true;
        // treat empty string / null / undefined as missing
        const v = details[f];
        return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
      });

      if (missing.length === 0) {
        // profile complete -> issue token
        const token = jwt.sign({ sub: user._id.toString(), phone, roles: user.roles || [] }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        return res.json({ success: true, token, user, details });
      } else {
        // profile incomplete -> refresh verified markers and ask to complete
        await redisClient.setex(VERIFIED_KEY_BY_PHONE(phone), VERIFIED_TTL, user._id.toString());
        await redisClient.setex(VERIFIED_KEY_BY_USER(user._id.toString()), VERIFIED_TTL, phone);

        return res.status(206).json({
          success: false,
          code: 'additional_info_required',
          message: 'otp_verified_partial_user_exists',
          userId: user._id.toString(),
          referralCode: user.referralCode || (details && details.referralCode) || null,
          missing
        });
      }
    }


    // user not found -> create minimal user entry so we can continue flow
    // create new ObjectId
    const newId = new mongoose.Types.ObjectId();

    // generate unique 6-char referral code (ensures no collision)
    const referralCode = await createUniqueReferralCode(UserDetails);

    const minimalUser = new User({
      _id: newId,
      phone,
      email: null,
      createdAt: new Date(),
      roles: ['user'],
      referralCode,
      referredBy: null
    });

    await minimalUser.save();

    // create a lightweight UserDetails entry with phone and referralCode (optional)
    const minimalDetails = new UserDetails({
      userId: newId,
      name: null,
      city: null,
      dob: null,
      maritalStatus: null,
      occupation: null,
      referralCode,
      referredBy: null
    });
    await minimalDetails.save();

    // Mark verification in Redis for subsequent "complete profile" request
    await redisClient.setex(VERIFIED_KEY_BY_PHONE(phone), VERIFIED_TTL, newId.toString());
    await redisClient.setex(VERIFIED_KEY_BY_USER(newId.toString()), VERIFIED_TTL, phone);

    // Tell client to collect additional info — include userId so client can call /complete
    return res.status(206).json({
      success: false,
      code: 'additional_info_required',
      message: 'otp_verified_partial_user_created',
      userId: newId.toString(),
      referralCode
    });

  } catch (e) {
    console.error('verify err', e);
    return res.status(500).json({ error: 'server_error', message: e.message });
  }
});

// POST /auth/complete -> { userId, name, city, dob, maritalStatus, occupation, email?, referredBy? }
router.post('/complete', async (req, res) => {
  try {
    const { userId, name, city, dob, maritalStatus, occupation, email, referredBy } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const User = getUserModel(mongoose);
    const UserDetails = getUserDetailsModel(mongoose);

    // verify that this user was recently verified via OTP
    const phone = await redisClient.get(VERIFIED_KEY_BY_USER(userId));
    if (!phone) {
      return res.status(410).json({ error: 'verification_expired_or_invalid' });
    }

    // require essential fields
    const requiredFields = ['name', 'city', 'dob', 'maritalStatus', 'occupation'];
    const missing = requiredFields.filter(f => !(req.body && req.body[f]));
    if (missing.length > 0) {
      return res.status(400).json({ error: 'missing_fields', missing });
    }

    // update user (set email, referredBy if present)
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    if (email) user.email = email;
    if (referredBy) user.referredBy = referredBy;
    // ensure roles include 'user'
    user.roles = Array.from(new Set([...(user.roles || []), 'user']));
    await user.save();

    // update/create user details
    let details = await UserDetails.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!details) {
      details = new UserDetails({ userId: new mongoose.Types.ObjectId(userId) });
    }

    details.name = name;
    details.city = city;
    details.dob = dob ? new Date(dob) : null;
    details.maritalStatus = maritalStatus;
    details.occupation = occupation;
    if (referredBy) details.referredBy = referredBy;
    // keep referralCode as-is (already set)
    await details.save();

    // remove verified keys
    await redisClient.del(VERIFIED_KEY_BY_USER(userId));
    await redisClient.del(VERIFIED_KEY_BY_PHONE(phone));

    // issue final JWT
    const token = jwt.sign({ sub: user._id.toString(), phone, roles: user.roles || [] }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.json({ success: true, token, user, details });

  } catch (e) {
    console.error('complete err', e);
    return res.status(500).json({ error: 'server_error', message: e.message });
  }
});

module.exports = router;
