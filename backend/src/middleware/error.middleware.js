import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message, error.errors || []);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = new ApiError(409, `${field ? `${field} already exists` : 'Duplicate value'}.`);
  }

  if (env.nodeEnv === 'development' && error.statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    data: null,
    errors: error.errors || [],
  });
}
