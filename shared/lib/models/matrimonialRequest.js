module.exports = function getMatrimonialRequestModel(mongoose) {
  try {
    if (mongoose.models && mongoose.models.MatrimonialRequest) {
      return mongoose.model('MatrimonialRequest');
    }
  } catch (e) {}

  const Schema = mongoose.Schema;

  const MatrimonialRequestSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: String,
    mobile: String,
    city: String,
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }, { collection: 'matrimonial_requests' });

  return mongoose.model('MatrimonialRequest', MatrimonialRequestSchema);
};
