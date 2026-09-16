import mongoose from 'mongoose';

const { Schema } = mongoose;

// A recurring weekly slot, e.g. { dayOfWeek: 0 (Sun), startTime: "18:00", endTime: "19:00" }
const recurringSlotSchema = new Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    startTime: { type: String, required: true }, // "HH:mm" in batch timezone
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const batchSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. "Batch A - Evening"
    timezone: { type: String, default: 'UTC' }, // timezone the recurring slots are defined in
    recurringSlots: { type: [recurringSlotSchema], required: true, validate: (v) => v.length > 0 },
    startDate: { type: Date, required: true }, // UTC
    endDate: { type: Date, required: true }, // UTC
    capacity: { type: Number, required: true, min: 1 },
    enrolledCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

batchSchema.index({ courseId: 1, isActive: 1 });
batchSchema.index({ tutorId: 1, isActive: 1 });
batchSchema.virtual('isFull').get(function isFull() {
  return this.enrolledCount >= this.capacity;
});
batchSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Batch', batchSchema);
