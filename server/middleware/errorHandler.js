/**
 * Centralized Express error handler.
 * Must be registered with 4 parameters (err, req, res, next) to be treated as an error handler.
 */
export function errorHandler(err, req, res, next) {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: messages });
  }

  // Mongoose cast error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for field: ${err.path}` });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: `Duplicate value for ${field}` });
  }

  // JSON body parse error
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  // Rate limit error (express-rate-limit passes status 429)
  if (res.statusCode === 429) {
    return res.json({ error: 'Too many requests, please slow down' });
  }

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} -`, err);

  res.status(500).json({ error: 'Internal server error' });
}
