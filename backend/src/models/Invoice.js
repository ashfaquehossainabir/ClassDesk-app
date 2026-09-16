import mongoose from 'mongoose';

const { Schema } = mongoose;

const invoiceSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['pending', 'paid', 'overdue', 'void'], default: 'pending', index: true },
    dueDate: { type: Date, required: true, index: true },
    stripeCheckoutSessionId: { type: String },
    invoiceNumber: { type: String, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ studentId: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

invoiceSchema.pre('save', function generateInvoiceNumber(next) {
  if (!this.invoiceNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.invoiceNumber = `INV-${ts}-${rand}`;
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
