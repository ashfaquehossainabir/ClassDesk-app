import { ApiError } from '../utils/ApiError.js';

// Wraps a Zod schema and validates req.body / req.query / req.params
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(new ApiError(422, 'Validation failed', errors));
    }
    req[source] = result.data;
    next();
  };
}
