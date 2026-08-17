import { OFFRES_URL } from './constants.js';
import { formatFrDate } from './visit-date.js';

function apiKey() {
  return String(process.env.BREVO_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

export function isEmailConfigured() {
  return apiKey().startsWith('xkeysib-');
}

function sender() {
  return {
    name: process.env.BREVO_SENDER_NAME || 'Boxing Center',
    email: process.env.BREVO_SENDER_EMAIL || 'suzinabot@gmail.com',
  };
}

function internalInbox() {
  return (
    process.env.SEANCE_OFFERTE_INBOX ||
    process.env.BREVO_INTERNAL_TO ||
    'seancegratuite@boxingcenter.fr'
  );
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function confirmationSubject() {
  return 'Confirmation de votre séance d’essai offerte Boxing Center';
}

export function confirmationText({ prenom, salleLabel, jourLabel }) {
  return [
    `Bonjour ${prenom},`,
    '',
    'Votre inscription à la séance d’essai offerte Boxing Center est bien enregistrée.',
    '',
    `Vous avez choisi la salle suivante : ${salleLabel}`,
    `Jour de venue prévu : ${jourLabel}`,
    '',
    'Cette séance est habituellement proposée à 10 €, mais elle vous est offerte dans le cadre de notre opération spéciale.',
    '',
    'Présentez-vous directement à l’accueil de la salle avec une tenue de sport. Notre équipe se fera un plaisir de vous recevoir.',
    '',
    'L’équipe Boxing Center',
  ].join('\n');
}

export function confirmationHtml(input) {
  const text = confirmationText(input);
  return `<p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`;
}

export function relanceProspectText({ prenom }) {
  return [
    `Bonjour ${prenom},`,
    '',
    'Il ne vous reste que très peu de temps pour pouvoir bénéficier de nos offres promos 29 € et 259 €.',
    '',
    'Pour finaliser votre inscription, rendez-vous sur :',
    OFFRES_URL,
    '',
    'L’équipe BOXING CENTER',
  ].join('\n');
}

export function managerWhatsAppText({ manager, lead }) {
  return [
    `Bonjour ${manager.nom},`,
    '',
    'Le prospect suivant a réalisé une séance d’essai gratuite web mais aucune vente n’apparaît sur sa fiche Deciplus malgré la relance automatique.',
    '',
    'Merci d’effectuer une dernière tentative téléphonique.',
    '',
    'Informations prospect :',
    `Nom : ${lead.nom}`,
    `Prénom : ${lead.prenom}`,
    `Téléphone : ${lead.tel}`,
    `Email : ${lead.email}`,
    `Salle choisie : ${lead.salle_label || lead.salle}`,
    `Jour de venue prévu : ${lead.visit_date ? formatFrDate(lead.visit_date) : lead.jour_nom}`,
    'Offre d’intérêt : Séance d’essai gratuite web',
    '',
    'Message automatique Boxing Center',
  ].join('\n');
}

export function internalRecapHtml({ data, orderId, dryRun, error }) {
  const ami = data.ami
    ? `<p><strong>Ami(e)</strong> : ${escapeHtml(data.ami.prenom)} ${escapeHtml(data.ami.nom)} — ${escapeHtml(data.ami.email)} — ${escapeHtml(data.ami.tel)}</p>`
    : '<p>Pas d’ami(e).</p>';
  return `
    <h2>Inscription séance d’essai offerte</h2>
    <p>Référence : <code>${escapeHtml(orderId)}</code>${dryRun ? ' — DRY RUN' : ''}</p>
    ${error ? `<p style="color:#b00"><strong>Erreur :</strong> ${escapeHtml(error)}</p>` : ''}
    <p><strong>Prospect</strong> : ${escapeHtml(data.prenom)} ${escapeHtml(data.nom)}<br/>
    ${escapeHtml(data.email)} — ${escapeHtml(data.tel)}<br/>
    Né(e) le ${escapeHtml(data.naissance)} — ${escapeHtml(data.sexe)}</p>
    <p>Salle : ${escapeHtml(data.gym?.label || data.salle)}<br/>
    Jour prévu : ${escapeHtml(data.jour_nom)} (${escapeHtml(data.visit_date)})</p>
    ${ami}
    <p>Source : ${escapeHtml(data.src)}</p>
  `;
}

export async function sendEmailViaBrevo({ to, subject, html, text, fetchImpl = fetch }) {
  if (!to) return { sent: false, reason: 'no_recipient' };
  if (!isEmailConfigured()) return { sent: false, reason: 'brevo_not_configured' };
  const res = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: sender(),
      to: [{ email: to }],
      subject,
      htmlContent: html || `<p>${escapeHtml(text || '')}</p>`,
      textContent: text || undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return { sent: true, via: 'brevo', to };
}

export async function sendConfirmationEmails(data, { dryRun = false, fetchImpl = fetch } = {}) {
  if (dryRun) {
    return { sent: false, reason: 'dry_run', preview: confirmationText({
      prenom: data.prenom,
      salleLabel: data.gym.label,
      jourLabel: `${data.jour_nom} (${data.visit_date})`,
    }) };
  }
  const payload = {
    prenom: data.prenom,
    salleLabel: data.gym.label,
    jourLabel: `${data.jour_nom} (${formatFrDate(data.visit_date)})`,
  };
  const results = [];
  results.push(
    await sendEmailViaBrevo({
      to: data.email,
      subject: confirmationSubject(),
      text: confirmationText(payload),
      html: confirmationHtml(payload),
      fetchImpl,
    })
  );
  if (data.ami?.email) {
    results.push(
      await sendEmailViaBrevo({
        to: data.ami.email,
        subject: confirmationSubject(),
        text: confirmationText({
          prenom: data.ami.prenom,
          salleLabel: data.gym.label,
          jourLabel: `${data.jour_nom} (${formatFrDate(data.visit_date)})`,
        }),
        html: confirmationHtml({
          prenom: data.ami.prenom,
          salleLabel: data.gym.label,
          jourLabel: `${data.jour_nom} (${formatFrDate(data.visit_date)})`,
        }),
        fetchImpl,
      })
    );
  }
  return results;
}

export async function sendInternalNotification(data, { orderId, dryRun, error, fetchImpl = fetch } = {}) {
  if (dryRun) return { sent: false, reason: 'dry_run' };
  return sendEmailViaBrevo({
    to: internalInbox(),
    subject: error
      ? `[Erreur] Séance offerte ${orderId}`
      : `Séance offerte — ${data.prenom} ${data.nom} — ${data.gym?.nom || data.salle}`,
    html: internalRecapHtml({ data, orderId, dryRun, error }),
    fetchImpl,
  });
}

export async function sendRelanceEmail(lead, { fetchImpl = fetch, dryRun = false } = {}) {
  if (dryRun) return { sent: false, reason: 'dry_run' };
  const text = relanceProspectText({ prenom: lead.prenom });
  return sendEmailViaBrevo({
    to: lead.email,
    subject: 'Boxing Center — il reste peu de temps pour nos offres 29 € et 259 €',
    text,
    html: `<p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`,
    fetchImpl,
  });
}
