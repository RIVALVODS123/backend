const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * Run DB migrations on startup to ensure the table exists.
 */
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS whitelist_submissions (
        id            SERIAL PRIMARY KEY,
        discord_tag   VARCHAR(100)  NOT NULL,
        edad          SMALLINT      NOT NULL,
        fuente        VARCHAR(50)   NOT NULL,
        exp           VARCHAR(50)   NOT NULL,
        otros_servers TEXT          NOT NULL,
        quiz_score    SMALLINT      NOT NULL,
        quiz_detail   JSONB         NOT NULL DEFAULT '[]',
        sit_1         TEXT          NOT NULL,
        sit_2         TEXT          NOT NULL,
        sit_3         TEXT          NOT NULL,
        pg_nombre     VARCHAR(120)  NOT NULL,
        pg_raza       VARCHAR(120)  NOT NULL,
        historia      TEXT          NOT NULL,
        pregunta_resp VARCHAR(300)  NOT NULL,
        status        VARCHAR(20)   NOT NULL DEFAULT 'pendiente',
        ip_hash       VARCHAR(64),
        submitted_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);
    console.log('[db] Table ready');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
