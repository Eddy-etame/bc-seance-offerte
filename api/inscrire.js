import '../lib/load-env.js';
import {
  buildDeciplusJobs,
  errorMessage,
  isDryRunRequest,
  validateInscription,
} from '../lib/inscription.js';
import { forwardJobs } from '../lib/bot.js';
import { sendConfirmationEmails, sendInternalNotification } from '../lib/email.js';
import { saveLead } from '../lib/leads.js';

function queryFromUrl(req) {
  try {
    const host = req.headers?.host || 'localhost';
    const url = new URL(req.url || '/', `http://${host}`);
    return Object.fromEntries(url.searchParams.entries());
  } catch {
    return {};
  }
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

export async function handleInscrire(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'Méthode non autorisée' });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    json(res, 400, { ok: false, error: 'JSON invalide' });
    return;
  }

  const dryRun = isDryRunRequest({
    headers: req.headers || {},
    query: queryFromUrl(req),
    body,
  });

  const parsed = validateInscription(body);
  if (!parsed.ok) {
    json(res, 400, {
      ok: false,
      error: errorMessage(parsed.errors) || 'Formulaire incomplet',
      errors: parsed.errors,
    });
    return;
  }

  const { orderId, jobs } = buildDeciplusJobs(parsed.data);
  const lead = {
    id: orderId,
    prenom: parsed.data.prenom,
    nom: parsed.data.nom,
    email: parsed.data.email,
    tel: parsed.data.tel,
    naissance: parsed.data.naissance,
    sexe: parsed.data.sexe,
    salle: parsed.data.salle,
    salle_label: parsed.data.gym.label,
    jour: parsed.data.jour,
    jour_nom: parsed.data.jour_nom,
    visit_date: parsed.data.visit_date,
    src: parsed.data.src,
    ami: parsed.data.ami,
    jobs: jobs.map((j) => j.order_id),
    dry_run: dryRun,
    has_sale: false,
    status: dryRun ? 'dry_run' : 'queued',
  };

  try {
    await saveLead(lead);
  } catch (err) {
    json(res, 500, { ok: false, error: `Enregistrement impossible : ${err.message}` });
    return;
  }

  let botResults = [];
  let botError = null;
  if (!dryRun) {
    try {
      botResults = await forwardJobs(jobs);
    } catch (err) {
      botError = err.message;
      lead.status = 'error';
      lead.last_error = botError;
      await saveLead(lead).catch(() => {});
      await sendInternalNotification(parsed.data, { orderId, error: botError }).catch(() => {});
      json(res, 502, {
        ok: false,
        error: 'Échec création fiche Deciplus. L’équipe a été prévenue.',
        order_id: orderId,
      });
      return;
    }
  }

  const emails = await sendConfirmationEmails(parsed.data, { dryRun }).catch((err) => [
    { sent: false, error: err.message },
  ]);
  const internal = await sendInternalNotification(parsed.data, { orderId, dryRun }).catch((err) => ({
    sent: false,
    error: err.message,
  }));

  console.info('[seance-offerte] inscription', {
    order_id: orderId,
    dry_run: dryRun,
    fiches: jobs.length,
    salle: parsed.data.salle,
    visit_date: parsed.data.visit_date,
  });

  json(res, 200, {
    ok: true,
    order_id: orderId,
    dry_run: dryRun,
    fiches: jobs.length,
    jobs: jobs.map((j) => ({
      order_id: j.order_id,
      is_friend_referral: j.is_friend_referral,
      birthdate: j.customer.birthdate,
      address: j.customer.address,
      postal_code: j.customer.postal_code,
      city: j.customer.city,
      sale_type: j.sale_type,
      create_sale: j.create_sale,
      info_compta: j.info_compta,
    })),
    visit_date: parsed.data.visit_date,
    bot: botResults,
    emails,
    internal,
  });
}

export default async function handler(req, res) {
  try {
    await handleInscrire(req, res);
  } catch (err) {
    if (!res.headersSent) {
      json(res, 500, { ok: false, error: err.message || 'Erreur serveur' });
    }
  }
}
