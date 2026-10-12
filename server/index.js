import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import eventsRouter from './routes/events.js';
import sessionsRouter from './routes/sessions.js';
import pagesRouter from './routes/pages.js';
import analyticsRouter from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';

const PORT = Number(process.env.PORT) || 8000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();

// ─── CORS ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      CLIENT_ORIGIN,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body parsers ────────────────────────────────────────────────────────────
// The tracker sends text/plain via sendBeacon (avoids CORS preflight), so accept both
app.use(
  express.json({
    limit: '500kb',
    type: ['application/json', 'text/plain'],
  })
);

// ─── Rate limiting ───────────────────────────────────────────────────────────
const eventsLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 200,               // 200 event posts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many event requests, please slow down' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/events', eventsLimiter);
app.use('/api', generalLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/analytics', analyticsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    database: states[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Client origin: ${CLIENT_ORIGIN}\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
