// services/user-service/routes/userProfile.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// service layer - contains business logic (DB updates)
const profileService = require('../services/profileService');
const matrimonialService = require('../services/matrimonialService');

/**
 * PATCH /user/:userId/visibility
 * Body: { visible: true|false }
 *
 * Route only: validation / request parsing / response handling.
 * All DB logic lives in services/profileService.js
 */
router.patch('/set/:userId/visibility', async (req, res) => {
  try {
    const { userId } = req.params;
    const { visible } = req.body;

    if (typeof visible === 'undefined') {
      return res.status(400).json({ error: 'visible boolean required in body' });
    }

    // Optional: basic ObjectId guard here for faster validation
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'invalid userId' });
    }

    // call service (business logic)
    const updated = await profileService.setProfileVisibility(userId, visible);

    return res.status(200).json({ ok: true, user: updated });
  } catch (err) {
    // service may throw errors with status property
    console.error('PATCH /user/:userId/visibility error', err);
    return res.status(err.status || 500).json({ error: err.message || 'server_error' });
  }
});


router.post('/apply-matrimonial', async (req, res) => {
  try {
    const userId = req.auth.sub;

    const init = await matrimonialService.applyMatrimonial(userId);

    return res.json({ ok: true, ...init });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});


router.patch('/matrimonial/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;

    const updated = await matrimonialService.updateMatrimonial(profileId, req.body);

    return res.json({ ok: true, profile: updated });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});


module.exports = router;
