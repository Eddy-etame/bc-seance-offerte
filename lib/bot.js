function botBase() {
  return String(process.env.BOXPLUS_BOT_URL || process.env.BOXPLUS_BOT_URL_OPS || '')
    .trim()
    .replace(/\/$/, '');
}

function secret() {
  return String(process.env.SYNC_SECRET || process.env.BRIDGE_SECRET || '').trim();
}

export function publicBaseUrl() {
  const explicit = String(process.env.PUBLIC_URL || process.env.SEANCE_OFFERTE_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:5610';
}

export async function forwardJobToBot(order, { fetchImpl = fetch } = {}) {
  const base = botBase();
  if (!base) {
    return { forwarded: false, reason: 'no_bot_url' };
  }
  const res = await fetchImpl(`${base}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sync-secret': secret(),
    },
    body: JSON.stringify({
      ...order,
      status_callback_base: order.status_callback_base || publicBaseUrl(),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Bot ingest HTTP ${res.status}`);
  }
  return { forwarded: true, bot_url: base, ...body };
}

export async function forwardJobs(jobs, opts = {}) {
  const results = [];
  for (const job of jobs) {
    results.push(await forwardJobToBot(job, opts));
  }
  return results;
}
