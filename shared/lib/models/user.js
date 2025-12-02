
module.exports = function getUserModel(mongoose) {
  // If model already registered (when multiple services require same file), reuse it
  try {
    if (mongoose && mongoose.models && mongoose.models.User) {
      return mongoose.model('User');
    }
  } catch (e) {
    // ignore
  }

  const Schema = mongoose.Schema;

  const UserSchema = new Schema({
    // minimal shared fields — extend in service-specific models if needed
    _id: { type: Schema.Types.ObjectId },
    email: { type: String, index: true, sparse: true },
    phone: { type: String, index: true, sparse: true },
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
    // referral related
    referralCode: { type: String, index: true, sparse: true },
    referredBy: { type: String, default: null },
    // roles / flags
    roles: { type: [String], default: [] },
    meta: { type: Schema.Types.Mixed, default: {} }
  }, { collection: 'users', strict: false });

  return mongoose.model('User', UserSchema);
};
