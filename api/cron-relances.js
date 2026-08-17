import '../lib/load-env.js';
import { runRelances } from '../lib/relances.js';

function authorized(req) {
  const secret = String(process.env.CRON_SECRET || process.env.SYNC_SECRET || '').trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const header = String(req.headers['authorization'] || req.headers['x-cron-secret'] || req.headers['x-sync-secret'] || '');
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return token === secret;
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'Méthode non autorisée' });
    return;
  }
  if (!authorized(req)) {
    json(res, 401, { ok: false, error: 'unauthorized' });
    return;
  }
  try {
    const results = await runRelances({
      dryRun: process.env.DRY_RUN === '1',
    });
    json(res, 200, { ok: true, count: results.length, results });
  } catch (err) {
    json(res, 500, { ok: false, error: err.message });
  }
}
