const rateLimit = require('express-rate-limit');

/**
 * Global limiter — protects all routes from flooding.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

/**
 * Strict limiter for form submissions: 3 attempts per IP per hour.
 * Prevents automated spam submissions.
 */
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados envíos desde esta IP. Inténtalo más tarde.' },
});

module.exports = { globalLimiter, submitLimiter };
