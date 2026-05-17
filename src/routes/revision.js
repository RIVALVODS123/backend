'use strict';

const express = require('express');
const { get } = require('../store/submissions');

const router = express.Router();

const FUENTE_MAP = { amigo: 'Un amigo', discord: 'Discord', foro: 'Foro', redes: 'Redes sociales', otro: 'Otro' };
const EXP_MAP = { ninguna: 'Ninguna', basica: 'Básica', media: 'Media', avanzada: 'Avanzada' };
const LETTERS = ['A', 'B', 'C', 'D'];

function escapeHtml(str) {
  if (str === null || str === undefined) return '—';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderRevision(sub) {
  const e = escapeHtml;
  const scoreClass = sub.quizScore >= 8 ? 'score-g' : sub.quizScore >= 5 ? 'score-y' : 'score-r';
  const scoreIcon = sub.quizScore >= 8 ? '✅' : sub.quizScore >= 5 ? '⚠️' : '❌';

  const date = new Date(sub.submittedAt).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const quizHtml = sub.quiz.map((q, i) => {
    const cls = q.isCorrect ? 'ok' : 'fail';
    const optsHtml = LETTERS.map((letter, idx) => {
      const text = q.options[idx] || letter;
      const isUser = letter === q.answer;
      const isCorrect = letter === q.correct;
      let cls = 'opt';
      if (isUser && q.isCorrect) cls += ' u-ok';
      else if (isUser && !q.isCorrect) cls += ' u-fail';
      else if (!isUser && isCorrect) cls += ' correct-hint';
      return `<span class="${cls}">${e(letter)}: ${e(text)}</span>`;
    }).join('');

    const wrongNote = !q.isCorrect
      ? `<div style="margin-top:8px;font-size:0.78rem;color:#888">Respuesta correcta: <strong style="color:#3bba6c">${e(q.correct)}: ${e(q.options[LETTERS.indexOf(q.correct)])}</strong></div>`
      : '';

    return `
    <div class="quiz-item ${cls}">
      <div class="quiz-num">Pregunta ${i + 1} &nbsp;${q.isCorrect ? '✅' : '❌'}&nbsp; <span style="color:#555;font-size:0.7rem">(índice banco: ${q.questionIndex})</span></div>
      <div class="quiz-text">${e(q.questionText)}</div>
      <div class="opts">${optsHtml}</div>
      ${wrongNote}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Revisión #${e(sub.id)} · Urban Legacy</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:#0a0b0d;color:#d0d0d0;padding:28px 16px;line-height:1.55}
    .wrap{max-width:860px;margin:0 auto}
    .hdr{border-bottom:2px solid #f5793a;padding-bottom:14px;margin-bottom:26px}
    .hdr h1{font-size:1.45rem;color:#f5793a;font-weight:700}
    .hdr .meta{color:#666;font-size:0.82rem;margin-top:6px}
    .badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:0.78rem;background:#1e2d4a;color:#7aadff;font-weight:600}
    section{background:#13151a;border:1px solid #1e2026;border-radius:10px;padding:20px 22px;margin-bottom:16px}
    h2{font-size:0.78rem;color:#f5793a;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #1e2026}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
    .fl{font-size:0.72rem;color:#666;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}
    .fv{font-size:0.92rem;color:#e0e0e0}
    .prose{white-space:pre-wrap;font-size:0.9rem;background:#0d0e11;border-radius:6px;padding:14px 16px;border:1px solid #1e2026;line-height:1.65}
    .quiz-item{background:#0d0e11;border-radius:8px;padding:14px 16px;margin-bottom:10px;border-left:3px solid #2a2a2a}
    .quiz-item.ok{border-left-color:#3bba6c}
    .quiz-item.fail{border-left-color:#e05252}
    .quiz-num{font-size:0.75rem;color:#666;margin-bottom:5px}
    .quiz-text{font-size:0.92rem;color:#ddd;margin-bottom:10px;font-weight:500}
    .opts{display:flex;flex-wrap:wrap;gap:6px}
    .opt{padding:4px 12px;border-radius:4px;font-size:0.82rem;border:1px solid #2a2a2a;background:#1a1a1a;color:#888}
    .u-ok{border-color:#3bba6c!important;background:#142a1e!important;color:#3bba6c!important;font-weight:700}
    .u-fail{border-color:#e05252!important;background:#2a1414!important;color:#e05252!important;font-weight:700}
    .correct-hint{border-color:#3bba6c!important;background:#0d1e14!important;color:#3bba6c!important}
    .score{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:20px;font-weight:700;font-size:1.1rem;margin-bottom:16px}
    .score-g{background:#142a1e;color:#3bba6c}
    .score-y{background:#2a2a14;color:#e8c93a}
    .score-r{background:#2a1414;color:#e05252}
    .sit-label{font-size:0.72rem;color:#f5793a;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
    hr{border:none;border-top:1px solid #1e2026;margin:16px 0}
  </style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>📋 Revisión de WhiteList</h1>
    <div class="meta">ID: <strong>${e(sub.id)}</strong> &nbsp;·&nbsp; Enviado: ${e(date)} &nbsp;·&nbsp; <span class="badge">⏳ Pendiente de revisión</span></div>
  </div>

  <section>
    <h2>Datos de contacto</h2>
    <div class="grid">
      <div><div class="fl">Discord</div><div class="fv">${e(sub.discordId)}</div></div>
      <div><div class="fl">Edad</div><div class="fv">${e(String(sub.edad))}</div></div>
      <div><div class="fl">Cómo nos encontró</div><div class="fv">${e(FUENTE_MAP[sub.fuente] || sub.fuente)}</div></div>
      <div><div class="fl">Experiencia en rol</div><div class="fv">${e(EXP_MAP[sub.exp] || sub.exp)}</div></div>
    </div>
  </section>

  <section>
    <h2>Servidores anteriores</h2>
    <div class="prose">${e(sub.otrosServers)}</div>
  </section>

  <section>
    <h2>Quiz de normativa &nbsp; <span class="score ${scoreClass}">${sub.quizScore}/10 ${scoreIcon}</span></h2>
    ${quizHtml}
  </section>

  <section>
    <h2>Situaciones roleadas</h2>
    <div class="sit-label">Situación 1</div>
    <div class="prose">${e(sub.sit1)}</div>
    <hr>
    <div class="sit-label">Situación 2</div>
    <div class="prose">${e(sub.sit2)}</div>
    <hr>
    <div class="sit-label">Situación 3</div>
    <div class="prose">${e(sub.sit3)}</div>
  </section>

  <section>
    <h2>Ficha del personaje</h2>
    <div class="grid" style="margin-bottom:14px">
      <div><div class="fl">Nombre</div><div class="fv">${e(sub.pgNombre)}</div></div>
      <div><div class="fl">Raza / Origen</div><div class="fv">${e(sub.pgRaza)}</div></div>
    </div>
    <div class="fl" style="margin-bottom:8px">Historia del personaje</div>
    <div class="prose" style="white-space:normal">${e(sub.historia)}</div>
  </section>

  <section>
    <h2>Pregunta de normas</h2>
    <div class="prose">${e(sub.pregunta)}</div>
  </section>
</div>
</body>
</html>`;
}

router.get('/:id', (req, res) => {
  const id = req.params.id;

  // Validate ID format (hex, 10 chars)
  if (!/^[a-f0-9]{10}$/.test(id)) {
    return res.status(404).send('<h1>Revisión no encontrada</h1>');
  }

  const sub = get(id);
  if (!sub) {
    return res.status(404).send(`
      <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>No encontrada</title>
      <style>body{font-family:system-ui;background:#0a0b0d;color:#d0d0d0;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}h1{color:#f5793a}p{color:#666;margin-top:8px}</style>
      </head><body><div><h1>📋 Revisión no encontrada</h1><p>El enlace ha expirado (48h) o no es válido.</p></div></body></html>
    `);
  }

  // Override helmet CSP to allow inline styles on this HTML page
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderRevision(sub));
});

module.exports = router;
