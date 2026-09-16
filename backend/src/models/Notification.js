import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'enrollment_confirmed',
        'session_reminder',
        'invoice_issued',
        'payment_received',
        'session_cancelled',
        'waitlist_promoted',
        'general',
      ],
      default: 'general',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // frontend route to deep-link to
    isRead: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
