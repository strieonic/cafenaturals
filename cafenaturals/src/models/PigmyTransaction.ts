import mongoose from 'mongoose';

const PigmyTransactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'PigmyAccount', required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'adjustment', 'opening_balance'], 
    required: true 
  },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: 'Admin' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.PigmyTransaction || mongoose.model('PigmyTransaction', PigmyTransactionSchema);
