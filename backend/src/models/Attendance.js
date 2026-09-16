import mongoose from 'mongoose';

const { Schema } = mongoose;

const attendanceSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'unmarked'], default: 'unmarked' },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    markedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1, courseId: 1 });

export default mongoose.model('Attendance', attendanceSchema);
