/**
 * Sends a Discord embed notification to the staff webhook when a new
 * whitelist submission arrives.
 */
async function notifyDiscord(submission) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return; // webhook optional; skip silently

  const scoreColor = submission.quizScore >= 8
    ? 0x57f287  // green
    : submission.quizScore >= 5
      ? 0xfee75c // yellow
      : 0xed4245; // red

  const embed = {
    title: '📋 Nueva solicitud de WhiteList',
    color: scoreColor,
    fields: [
      { name: 'Discord', value: submission.discordTag, inline: true },
      { name: 'Edad', value: String(submission.edad), inline: true },
      { name: 'Cómo nos encontró', value: submission.fuente, inline: true },
      { name: 'Experiencia en rol', value: submission.exp, inline: true },
      { name: 'Nota del quiz', value: `${submission.quizScore}/10`, inline: true },
      { name: 'Nombre del personaje', value: submission.pgNombre, inline: true },
      { name: 'Raza / Origen', value: submission.pgRaza, inline: true },
      { name: 'Experiencia previa', value: truncate(submission.otrosServers, 300) },
      { name: 'Historia del personaje', value: truncate(submission.historia, 800) },
      { name: 'Situación 1', value: truncate(submission.sit1, 300) },
      { name: 'Situación 2', value: truncate(submission.sit2, 300) },
      { name: 'Situación 3', value: truncate(submission.sit3, 300) },
      { name: 'Pregunta de normas', value: truncate(submission.preguntaResp, 200) },
    ],
    footer: { text: `ID: ${submission.id} · Urban Legacy` },
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify({ embeds: [embed] });

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) {
    console.error('[discord] Webhook failed:', response.status, await response.text());
  }
}

function truncate(str, max) {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

module.exports = { notifyDiscord };
