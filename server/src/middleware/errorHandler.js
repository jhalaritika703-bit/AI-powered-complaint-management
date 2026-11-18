import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (req, _res, next) =>
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));

const OBJECT_ID = /^[a-f\d]{24}$/i;
export function validateObjectId(req, _res, next, id) {
  if (!OBJECT_ID.test(id)) return next(new AppError(400, 'Invalid complaint ID'));
  next();
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: err.issues[0]?.message || 'Validation failed',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Request body is not valid JSON' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'Request body is too large' } });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: { message: err.message } });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { message: err.message } });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { message: 'Something went wrong on the server' } });
}
