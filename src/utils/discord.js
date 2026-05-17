/**
 * Sends a compact Discord embed with a link to the full revision page.
 */
async function notifyDiscord({ id, revisionUrl, discordId, edad, exp, quizScore, pgNombre }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const scoreColor = quizScore >= 8 ? 0x57f287 : quizScore >= 5 ? 0xfee75c : 0xed4245;
  const scoreIcon  = quizScore >= 8 ? '✅' : quizScore >= 5 ? '⚠️' : '❌';

  const EXP_MAP = { ninguna: 'Ninguna', basica: 'Básica', media: 'Media', avanzada: 'Avanzada' };

  const embed = {
    title: '📋 Nueva solicitud de WhiteList',
    color: scoreColor,
    description: `[🔍 Abrir revisión completa](${revisionUrl})`,
    fields: [
      { name: 'ID',          value: id,                                  inline: true },
      { name: 'Discord',     value: discordId,                           inline: true },
      { name: 'Edad',        value: String(edad),                        inline: true },
      { name: 'Personaje',   value: pgNombre,                            inline: true },
      { name: 'Experiencia', value: EXP_MAP[exp] || exp,                 inline: true },
      { name: 'Quiz',        value: `${quizScore}/10 ${scoreIcon}`,      inline: true },
      { name: 'Estado',      value: '⏳ Pendiente de revisión',           inline: false },
    ],
    footer: { text: 'Urban Legacy · Whitelist' },
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!response.ok) {
    console.error('[discord] Webhook failed:', response.status, await response.text());
  }
}

module.exports = { notifyDiscord };
