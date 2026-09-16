import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'tutor', 'student'], default: 'student', index: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    timezone: { type: String, default: 'UTC' },
    // For student role: optional parent contact used for notifications
    parentEmail: { type: String, lowercase: true, trim: true },
    parentName: { type: String, trim: true },
    tokenVersion: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model('User', userSchema);
