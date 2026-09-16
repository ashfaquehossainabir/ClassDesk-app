import mongoose from 'mongoose';

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    method: { type: String, enum: ['stripe', 'cash', 'bank_transfer', 'other'], required: true },
    reference: { type: String }, // stripe payment intent id, cheque no, etc.
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // admin who recorded manual payment
    paidAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

paymentSchema.index({ studentId: 1, paidAt: -1 });

export default mongoose.model('Payment', paymentSchema);
