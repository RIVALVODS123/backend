const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

const { submitLimiter } = require('../middleware/rateLimiter');
const { pool } = require('../db');
const { scoreQuiz } = require('../utils/scorer');
const { notifyDiscord } = require('../utils/discord');

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

    // Hash IP for privacy (GDPR-friendly — no raw IP stored)
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || '';
    const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex');

    let newId;
    try {
      const result = await pool.query(
        `INSERT INTO whitelist_submissions
           (discord_tag, edad, fuente, exp, otros_servers,
            quiz_score, quiz_detail,
            sit_1, sit_2, sit_3,
            pg_nombre, pg_raza, historia, pregunta_resp,
            ip_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING id`,
        [
          discord_id,
          parseInt(data.edad, 10),
          data.fuente,
          data.exp,
          data['otros-servers'],
          score,
          JSON.stringify(detail),
          data['sit-1'],
          data['sit-2'],
          data['sit-3'],
          data['pg-nombre'],
          data['pg-raza'],
          data.historia,
          data.pregunta,
          ipHash,
        ]
      );
      newId = result.rows[0].id;
    } catch (dbErr) {
      console.error('[whitelist] DB error:', dbErr.message);
      return res.status(500).json({ success: false, error: 'Error al guardar la solicitud.' });
    }

    // Discord notification (non-blocking — don't fail the request if it errors)
    notifyDiscord({
      id: newId,
      discordTag: discord_id,
      edad: data.edad,
      fuente: data.fuente,
      exp: data.exp,
      quizScore: score,
      pgNombre: data['pg-nombre'],
      pgRaza: data['pg-raza'],
      otrosServers: data['otros-servers'],
      historia: data.historia,
      sit1: data['sit-1'],
      sit2: data['sit-2'],
      sit3: data['sit-3'],
      preguntaResp: data.pregunta,
    }).catch(err => console.error('[discord] notify error:', err.message));

    return res.status(201).json({ success: true, id: newId, quizScore: score });
  }
);

module.exports = router;
