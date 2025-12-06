// services/user-service/services/matrimonialService.js
const mongoose = require('mongoose');
const getUserDetailsModel = require('../../../shared/lib/models/userDetails');

const UserDetails = getUserDetailsModel(mongoose);

const { Types } = mongoose;

/**
 * Toggle visibility in UserDetails (a simple boolean)
 * We'll **store** visibility at top-level field `isVisible` in user_details document
 */
async function setProfileVisibility(userId, visible) {
  if (!Types.ObjectId.isValid(userId)) {
    const err = new Error('Invalid userId');
    err.status = 400;
    throw err;
  }

  const userObjectId = new Types.ObjectId(userId);

  // Normalize visible to a proper boolean (handles "true"/"false" strings too)
  let boolVisible;
  if (visible === true || visible === 'true') {
    boolVisible = true;
  } else if (visible === false || visible === 'false') {
    boolVisible = false;
  } else {
    // fallback – in case something weird is sent
    boolVisible = !!visible;
  }

  const updated = await UserDetails.findOneAndUpdate(
    { userId: userObjectId },
    {
      $set: {
        isVisible: boolVisible,
        'profile.isVisible': boolVisible
      }
    },
    { new: true }
  ).lean();

  if (!updated) {
    const err = new Error('UserDetails not found');
    err.status = 404;
    throw err;
  }

  return updated;
}



/**
 * registerMatrimonial(userId, extra)
 * - upserts a matrimonial profile for given userId
 * - returns the saved matrimonial profile (or updated userDetails if fallback)
 */
async function registerMatrimonial(userId, extra = {}) {
  if (!Types.ObjectId.isValid(userId)) {
    const err = new Error('Invalid userId');
    err.status = 400;
    throw err;
  }
  const userObjectId = new Types.ObjectId(userId);

  // Ensure the user details exists
  const userDetails = await UserDetails.findOne({ userId: userObjectId }).lean();
  if (!userDetails) {
    const err = new Error('UserDetails not found for userId');
    err.status = 404;
    throw err;
  }

  // Build base profile from userDetails
  const baseProfile = {
    userId: userObjectId,
    name: userDetails.name || (userDetails.profile && userDetails.profile.name) || null,
    city: userDetails.city || (userDetails.profile && userDetails.profile.city) || null,
    dob: userDetails.dob || (userDetails.profile && userDetails.profile.dob) || null,
    maritalStatus: userDetails.maritalStatus || (userDetails.profile && userDetails.profile.maritalStatus) || null,
    occupation: userDetails.occupation || (userDetails.profile && userDetails.profile.occupation) || null,
    enabled: true,
    meta: Object.assign({}, (userDetails.profile || {}), extra || {}),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Try to load matrimonial model if present
  let MatrimonialModel = null;
  try {
    MatrimonialModel = require('../../../shared/lib/models/matrimonialProfile')(mongoose);
  } catch (e) {
    // model not present — we'll fallback to storing inside user_details.profile.matrimonial
    MatrimonialModel = null;
  }

  if (MatrimonialModel) {
    // upsert into matrimonial_profiles collection
    const saved = await MatrimonialModel.findOneAndUpdate(
      { userId: userObjectId },
      { $set: baseProfile, $currentDate: { updatedAt: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return saved;
  } else {
    // fallback: save into user_details.profile.matrimonial
    const updatedUserDetails = await UserDetails.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          'profile.matrimonial': baseProfile,
          'profile.isMatrimonialEnabled': true,
          isVisible: true // optional: make profile visible when applying
        }
      },
      { new: true }
    ).lean();

    return updatedUserDetails.profile && updatedUserDetails.profile.matrimonial ? updatedUserDetails.profile.matrimonial : updatedUserDetails;
  }
}

module.exports = {
  setProfileVisibility,
  registerMatrimonial
};
