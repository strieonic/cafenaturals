import mongoose from 'mongoose';

const PigmyAccountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  isArchived: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.PigmyAccount || mongoose.model('PigmyAccount', PigmyAccountSchema);
