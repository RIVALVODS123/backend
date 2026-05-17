require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { globalLimiter } = require('./middleware/rateLimiter');
const formsRouter = require('./routes/forms');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-server, Postman during dev)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ── Body parsing (limit size to prevent payload flooding) ────────────────────
app.use(express.json({ limit: '64kb' }));

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/forms', formsRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`[server] Listening on port ${PORT}`));
