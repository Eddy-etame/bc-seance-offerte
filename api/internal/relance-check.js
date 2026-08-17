import '../../lib/load-env.js';
import { getLead, updateLead } from '../../lib/leads.js';

function authorized(req) {
  const secret = String(process.env.SYNC_SECRET || process.env.BRIDGE_SECRET || '').trim();
  if (!secret) return false;
  const header = String(req.headers['x-sync-secret'] || req.headers['authorization'] || '');
  return header.replace(/^Bearer\s+/i, '').trim() === secret;
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { ok: false });
    return;
  }
  if (!authorized(req)) {
    json(res, 401, { ok: false, error: 'unauthorized' });
    return;
  }
  const body = await readBody(req);
  const orderId = String(body.order_id || '').replace(/#check-sale$/, '');
  const lead = await getLead(orderId);
  if (!lead) {
    json(res, 404, { ok: false, error: 'lead introuvable' });
    return;
  }
  const hasSale = Boolean(body.has_sale);
  const patch = {
    has_sale: hasSale,
    deciplus_member_id: body.deciplus_member_id || lead.deciplus_member_id || null,
    last_check_at: new Date().toISOString(),
  };
  if (hasSale) patch.status = 'converted';
  await updateLead(lead.id, patch);
  json(res, 200, { ok: true, id: lead.id, has_sale: hasSale });
}
