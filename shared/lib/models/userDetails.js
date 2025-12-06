// /shared/lib/models/userDetails.js
module.exports = function getUserDetailsModel(mongoose) {
  try {
    if (mongoose && mongoose.models && mongoose.models.UserDetails) {
      return mongoose.model('UserDetails');
    }
  } catch (e) {
    // ignore model redefinition errors
  }

  const { Schema } = mongoose;

  // Sub-schema for profile so isVisible is always a proper Boolean
  const ProfileSchema = new Schema(
    {
      isVisible: { type: Boolean, default: true },
      // add other profile fields here if needed, e.g.:
      // bio: { type: String },
      // age: { type: Number },
    },
    { _id: false } // don't create separate _id for profile
  );

  const UserDetailsSchema = new Schema(
    {
      userId: { type: Schema.Types.ObjectId, required: true, index: true },
      name: { type: String },
      city: { type: String },
      dob: { type: Date },
      maritalStatus: { type: String }, // e.g., single/married/divorced
      occupation: { type: String },
      referralCode: { type: String, index: true, unique: true, sparse: true },
      referredBy: { type: String, default: null },
      createdAt: { type: Date, default: Date.now },

      // top-level visibility flag
      isVisible: { type: Boolean, default: true },

      // structured profile object with its own isVisible boolean
      profile: { type: ProfileSchema, default: {} }
    },
    {
      collection: 'user_details',
      strict: false // keep as in your original if you want extra dynamic fields
    }
  );

  return mongoose.model('UserDetails', UserDetailsSchema);
};
