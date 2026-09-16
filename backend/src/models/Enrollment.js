import mongoose from 'mongoose';

const { Schema } = mongoose;

const enrollmentSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'waitlisted', 'cancelled', 'completed'],
      default: 'active',
      index: true,
    },
    waitlistPosition: { type: Number, default: null },
    enrolledAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// A student can only have one active/waitlisted enrollment per batch
enrollmentSchema.index({ studentId: 1, batchId: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['active', 'waitlisted'] } } });
enrollmentSchema.index({ batchId: 1, status: 1 });

export default mongoose.model('Enrollment', enrollmentSchema);
