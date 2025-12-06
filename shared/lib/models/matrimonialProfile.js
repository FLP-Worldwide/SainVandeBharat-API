// shared/lib/models/matrimonialProfile.js
module.exports = function getMatrimonialProfileModel(mongoose) {
  try {
    if (mongoose.models && mongoose.models.MatrimonialProfile) {
      return mongoose.model('MatrimonialProfile');
    }
  } catch (e) {}

  const Schema = mongoose.Schema;

  const MatrimonialProfileSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },

    // BASIC DETAILS (INIT STEP)
    name: String,
    mobile: String,
    city: String,
    enabled: { type: Boolean, default: false },

    // ADVANCED DETAILS (FULL FORM)
    forWhom: { type: String, enum: ['self', 'son', 'daughter', 'brother', 'sister', 'other'], default: 'self' },
    fullName: String,
    dob: Date,
    fatherName: String,
    motherName: String,
    caste: String,
    occupation: String,
    marriageType: { type: String, enum: ['first', 'second'] },
    religion: String,
    region: String,
    photo: String,
    bio: String,
    education: String,
    height: String,

    meta: { type: Schema.Types.Mixed, default: {} },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, { collection: 'matrimonial_profiles', strict: false });

  MatrimonialProfileSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  return mongoose.model('MatrimonialProfile', MatrimonialProfileSchema);
};
