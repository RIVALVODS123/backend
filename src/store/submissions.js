'use strict';

/**
 * In-memory submission store with 48-hour TTL.
 * Data is lost on restart — acceptable for a short review window.
 */
const store = new Map();
const TTL_MS = 48 * 60 * 60 * 1000;

function save(id, data) {
  store.set(id, { data, expiresAt: Date.now() + TTL_MS });
  const t = setTimeout(() => store.delete(id), TTL_MS);
  if (t.unref) t.unref(); // don't block process exit
}

function get(id) {
  const entry = store.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(id);
    return null;
  }
  return entry.data;
}

module.exports = { save, get };
