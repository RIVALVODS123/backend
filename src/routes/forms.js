const crypto = require('crypto');
const express = require('express');
const { body, validationResult } = require('express-validator');

const { submitLimiter } = require('../middleware/rateLimiter');
const { scoreQuiz } = require('../utils/scorer');
const { notifyDiscord } = require('../utils/discord');
const { save } = require('../store/submissions');
const QUESTIONS = require('../utils/questions');

const router = express.Router();

// ── Validation rules ──────────────────────────────────────────────────────────
const whitelistValidation = [
  body('discord_id')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z0-9_.\-#]{2,100}$/)
    .withMessage('Usuario de Discord inválido'),

  body('data.edad')
    .isInt({ min: 18, max: 120 })
    .withMessage('Edad inválida (mínimo 18)'),

  body('data.fuente')
    .isIn(['amigo', 'discord', 'foro', 'redes', 'otro'])
    .withMessage('Fuente inválida'),

  body('data.exp')
    .isIn(['ninguna', 'basica', 'media', 'avanzada'])
    .withMessage('Nivel de experiencia inválido'),

  body('data.otros-servers')
    .trim()
    .notEmpty()
    .isLength({ max: 5000 })
    .withMessage('Campo otros-servers inválido'),

  // Quiz: 10 answers expected (question-0 … question-9)
  ...Array.from({ length: 10 }, (_, i) => [
    body(`data.question-${i}`)
      .isIn(['A', 'B', 'C', 'D'])
      .withMessage(`Respuesta de pregunta ${i} inválida`),
    body(`data.question-${i}-index`)
      .isInt({ min: 0, max: 200 })
      .withMessage(`Índice de pregunta ${i} inválido`),
  ]).flat(),

  body('data.sit-1')
    .trim()
    .notEmpty()
    .isLength({ max: 3000 })
    .withMessage('Situación 1 inválida'),

  body('data.sit-2')
    .trim()
    .notEmpty()
    .isLength({ max: 3000 })
    .withMessage('Situación 2 inválida'),

  body('data.sit-3')
    .trim()
    .notEmpty()
    .isLength({ max: 3000 })
    .withMessage('Situación 3 inválida'),

  body('data.pg-nombre')
    .trim()
    .notEmpty()
    .isLength({ max: 120 })
    .withMessage('Nombre del personaje inválido'),

  body('data.pg-raza')
    .trim()
    .notEmpty()
    .isLength({ max: 120 })
    .withMessage('Raza/origen inválido'),

  body('data.historia')
    .trim()
    .isLength({ min: 800, max: 10000 })
    .withMessage('Historia demasiado corta (mínimo 800 caracteres)'),

  body('data.pregunta')
    .trim()
    .notEmpty()
    .isLength({ max: 300 })
    .withMessage('Respuesta de normas inválida'),
];

// ── POST /forms/whitelist ─────────────────────────────────────────────────────
router.post(
  '/whitelist',
  submitLimiter,
  whitelistValidation,
  async (req, res) => {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { discord_id, data } = req.body;

    // Build quiz answers array
    const quizAnswers = Array.from({ length: 10 }, (_, i) => ({
      questionIndex: parseInt(data[`question-${i}-index`], 10),
      answer: data[`question-${i}`],
    }));

    const { score, detail } = scoreQuiz(quizAnswers);

    // Enrich quiz detail with question text + options for revision page
    const enrichedQuiz = detail.map((d, i) => {
      const q = QUESTIONS[d.questionIndex] || {};
      return {
        num: i + 1,
        questionIndex: d.questionIndex,
        questionText: q.q || `Pregunta ${d.questionIndex}`,
        options: q.opts || ['A', 'B', 'C', 'D'],
        answer: d.answer,
        correct: d.correct,
        isCorrect: d.isCorrect,
      };
    });

    // Generate unique ID and build revision URL
    const id = crypto.randomBytes(5).toString('hex');
    const rawDomain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.BACKEND_URL || '';
    const proto = rawDomain.startsWith('localhost') ? 'http' : 'https';
    const baseUrl = rawDomain ? `${proto}://${rawDomain}` : `http://localhost:${process.env.PORT || 3000}`;
    const revisionUrl = `${baseUrl}/revision/${id}`;

    // Save to in-memory store (48h TTL)
    save(id, {
      id,
      submittedAt: new Date().toISOString(),
      discordId: discord_id,
      edad: data.edad,
      fuente: data.fuente,
      exp: data.exp,
      otrosServers: data['otros-servers'],
      quiz: enrichedQuiz,
      quizScore: score,
      sit1: data['sit-1'],
      sit2: data['sit-2'],
      sit3: data['sit-3'],
      pgNombre: data['pg-nombre'],
      pgRaza: data['pg-raza'],
      historia: data.historia,
      pregunta: data.pregunta,
    });

    // Send to Discord and return immediately — no DB needed
    try {
      await notifyDiscord({
        id,
        revisionUrl,
        discordId: discord_id,
        edad: data.edad,
        exp: data.exp,
        quizScore: score,
        pgNombre: data['pg-nombre'],
      });
    } catch (err) {
      console.error('[discord] notify error:', err.message);
      return res.status(502).json({ success: false, error: 'No se pudo notificar al staff.' });
    }

    return res.status(201).json({ success: true, quizScore: score });
  }
);

module.exports = router;
