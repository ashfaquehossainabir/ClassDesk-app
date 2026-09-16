import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }
}
