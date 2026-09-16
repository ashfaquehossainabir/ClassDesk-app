import mongoose from 'mongoose';

const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pricingType: { type: String, enum: ['per_session', 'monthly'], default: 'monthly' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    capacity: { type: Number, required: true, min: 1, default: 10 },
    coverColor: { type: String, default: '#6366F1' }, // for calendar color-coding
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

courseSchema.index({ subject: 1, isActive: 1 });
courseSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Course', courseSchema);
