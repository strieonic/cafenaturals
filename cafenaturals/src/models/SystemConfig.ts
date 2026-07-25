import mongoose, { Schema } from 'mongoose';

const SystemConfigSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

export default mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);
