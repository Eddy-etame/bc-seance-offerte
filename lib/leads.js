import './load-env.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'data', 'leads.json');

const memory = new Map();

function backend() {
  if (process.env.LEADS_BACKEND === 'memory') return 'memory';
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
    return 'supabase';
  }
  return 'file';
}

async function readFileStore() {
  try {
    const raw = await readFile(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFileStore(rows) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(rows, null, 2), 'utf8');
}

function supabaseHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
}

function supabaseUrl(pathname, query = '') {
  const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  return `${base}/rest/v1/${pathname}${query}`;
}

function fromTunnelRow(row) {
  if (!row) return null;
  const meta = row.meta && typeof row.meta === 'object' ? row.meta : {};
  return {
    ...meta,
    id: meta.id || row.id,
    supabase_id: row.id,
    prenom: row.prenom || meta.prenom,
    nom: row.nom || meta.nom,
    tel: row.telephone || meta.tel,
    email: row.email || meta.email,
    salle: meta.salle || row.salle,
    salle_label: meta.salle_label || row.salle,
    created_at: row.created_at || meta.created_at,
  };
}

function toTunnelPayload(lead) {
  return {
    tunnel: 'seance_essai',
    prenom: lead.prenom || null,
    nom: lead.nom || null,
    telephone: lead.tel || null,
    email: lead.email || null,
    salle: lead.salle_label || lead.salle || null,
    meta: {
      ...lead,
      source: lead.src || lead.source || 'seance-offerte-web',
      product_id: 'seance-essai-offerte',
    },
  };
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data, text };
}

export async function saveLead(lead) {
  const row = {
    ...lead,
    created_at: lead.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const kind = backend();
  if (kind === 'memory') {
    memory.set(row.id, row);
    return row;
  }
  if (kind === 'file') {
    const rows = await readFileStore();
    const idx = rows.findIndex((r) => r.id === row.id);
    if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
    else rows.push(row);
    await writeFileStore(rows);
    return row;
  }

  const existing = await getLead(row.id);
  if (existing?.supabase_id) {
    const patched = await fetchJson(
      supabaseUrl('tunnel_leads', `?id=eq.${encodeURIComponent(existing.supabase_id)}`),
      {
        method: 'PATCH',
        headers: supabaseHeaders(),
        body: JSON.stringify(toTunnelPayload({ ...existing, ...row })),
      }
    );
    if (!patched.ok) throw new Error(`Supabase update lead: ${patched.status} ${String(patched.text).slice(0, 240)}`);
    const next = Array.isArray(patched.data) ? patched.data[0] : patched.data;
    return fromTunnelRow(next) || { ...existing, ...row };
  }

  const inserted = await fetchJson(supabaseUrl('tunnel_leads'), {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(toTunnelPayload(row)),
  });
  if (!inserted.ok) {
    throw new Error(`Supabase insert lead: ${inserted.status} ${String(inserted.text).slice(0, 240)}`);
  }
  const created = Array.isArray(inserted.data) ? inserted.data[0] : inserted.data;
  return fromTunnelRow(created) || row;
}

export async function getLead(id) {
  const kind = backend();
  if (kind === 'memory') return memory.get(id) || null;
  if (kind === 'file') {
    const rows = await readFileStore();
    return rows.find((r) => r.id === id) || null;
  }
  const byMeta = await fetchJson(
    supabaseUrl(
      'tunnel_leads',
      `?tunnel=eq.seance_essai&meta->>id=eq.${encodeURIComponent(id)}&select=*&limit=1`
    ),
    { headers: supabaseHeaders() }
  );
  if (byMeta.ok && Array.isArray(byMeta.data) && byMeta.data[0]) {
    return fromTunnelRow(byMeta.data[0]);
  }
  const byId = await fetchJson(
    supabaseUrl('tunnel_leads', `?id=eq.${encodeURIComponent(id)}&select=*`),
    { headers: supabaseHeaders() }
  );
  if (!byId.ok || !Array.isArray(byId.data) || !byId.data[0]) return null;
  return fromTunnelRow(byId.data[0]);
}

export async function updateLead(id, patch) {
  const current = await getLead(id);
  if (!current) return null;
  const next = { ...current, ...patch, updated_at: new Date().toISOString() };
  const kind = backend();
  if (kind === 'memory') {
    memory.set(id, next);
    return next;
  }
  if (kind === 'file') {
    const rows = await readFileStore();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    rows[idx] = next;
    await writeFileStore(rows);
    return next;
  }
  return saveLead(next);
}

export async function listLeads() {
  const kind = backend();
  if (kind === 'memory') return [...memory.values()];
  if (kind === 'file') return readFileStore();
  const res = await fetchJson(
    supabaseUrl('tunnel_leads', '?tunnel=eq.seance_essai&select=*&order=created_at.asc'),
    { headers: supabaseHeaders() }
  );
  if (!res.ok) throw new Error(`Supabase list leads: ${res.status} ${String(res.text).slice(0, 180)}`);
  return (Array.isArray(res.data) ? res.data : []).map(fromTunnelRow).filter(Boolean);
}

export function resetMemoryLeads() {
  memory.clear();
}
