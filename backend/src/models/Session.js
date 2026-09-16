import mongoose from 'mongoose';

const { Schema } = mongoose;

// A single concrete class occurrence, generated from a Batch's recurring rule
// or created as a one-off booking.
const sessionSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', index: true }, // null for pure one-off sessions
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true, index: true }, // stored UTC
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    capacity: { type: Number, required: true },
    enrolledCount: { type: Number, default: 0 },
    isOneOff: { type: Boolean, default: false },
    attendanceLocked: { type: Boolean, default: false },
    attendanceLockedAt: { type: Date },
    notes: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

sessionSchema.index({ tutorId: 1, startTime: 1 });
sessionSchema.index({ batchId: 1, startTime: 1 });
sessionSchema.index({ startTime: 1, status: 1 });

export default mongoose.model('Session', sessionSchema);
