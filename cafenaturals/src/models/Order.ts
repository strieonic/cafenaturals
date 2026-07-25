import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  status: { type: String, enum: ['open', 'billed', 'closed'], default: 'open', index: true },
  customer_phone: { type: String, default: null },
  customer_name: { type: String, default: null },
  timer_start: { type: Date, default: null },
  timer_charge: { type: Number, default: 0 },
  timer_duration_seconds: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  parcel_charge: { type: Number, default: 0 },
  extra_charge: { type: Number, default: 0 },
  extra_charge_label: { type: String, default: null },
  created_at: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false, // We use created_at manually to match old schema
  toObject: { virtuals: true }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
