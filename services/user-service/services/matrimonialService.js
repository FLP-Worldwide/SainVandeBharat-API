const mongoose = require('mongoose');
const getUserDetailsModel = require('../../../shared/lib/models/userDetails');
const getMatrimonialProfile = require('../../../shared/lib/models/matrimonialProfile');
const getMatrimonialRequest = require('../../../shared/lib/models/matrimonialRequest');

const UserDetails = getUserDetailsModel(mongoose);
const MatrimonialProfile = getMatrimonialProfile(mongoose);
const MatrimonialRequest = getMatrimonialRequest(mongoose);

const { Types } = mongoose;

// STEP 1 - INIT
async function applyMatrimonial(userId) {
  const id = new Types.ObjectId(userId);

  // fetch user details
  const details = await UserDetails.findOne({ userId: id }).lean();

  if (!details) {
    throw new Error('User details not found');
  }

  // create request record
  const request = await MatrimonialRequest.create({
    userId: id,
    name: details.name,
    mobile: details.mobile || details.profile?.mobile || null,
    city: details.city
  });

  // create a minimal matrimonial profile
  const profile = await MatrimonialProfile.create({
    userId: id,
    name: details.name,
    mobile: details.mobile || null,
    city: details.city,
    enabled: false
  });

  return { request, profile };
}

// STEP 2 - UPDATE FULL MATRIMONIAL PROFILE
async function updateMatrimonial(profileId, data) {
  const id = new Types.ObjectId(profileId);

  const profile = await MatrimonialProfile.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();

  if (!profile) throw new Error('Matrimonial profile not found');

  // mark request as completed
  await MatrimonialRequest.updateOne(
    { userId: profile.userId },
    { $set: { status: 'completed' } }
  );

  return profile;
}

module.exports = {
  applyMatrimonial,
  updateMatrimonial
};
