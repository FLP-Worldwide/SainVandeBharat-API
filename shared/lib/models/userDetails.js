// /shared/lib/models/userDetails.js
module.exports = function getUserDetailsModel(mongoose) {
  try {
    if (mongoose && mongoose.models && mongoose.models.UserDetails) {
      return mongoose.model('UserDetails');
    }
  } catch (e) {
    // ignore
  }

  const Schema = mongoose.Schema;

  const UserDetailsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String },
    city: { type: String },
    dob: { type: Date },
    maritalStatus: { type: String }, // e.g., single/married/divorced
    occupation: { type: String },
    referralCode: { type: String, index: true, unique: true, sparse: true },
    referredBy: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    // allow arbitrary extra profile meta
    profile: { type: Schema.Types.Mixed, default: {} }
  }, { collection: 'user_details', strict: false });

  return mongoose.model('UserDetails', UserDetailsSchema);
};
