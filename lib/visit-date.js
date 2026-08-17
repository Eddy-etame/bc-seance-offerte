import { JOURS } from './constants.js';

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(base, days) {
  const d = startOfDay(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function toIsoDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatFrDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(+date)) return String(d || '');
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Prochaine occurrence du jour choisi.
 * Si aujourd'hui est ce jour, on garde aujourd'hui (pas encore « passé »).
 */
export function nextVisitDate(jourId, now = new Date()) {
  const meta = JOURS[String(jourId || '').toLowerCase()];
  if (!meta) return null;
  const today = startOfDay(now);
  const current = today.getDay();
  const add = (meta.dow - current + 7) % 7;
  return addDays(today, add);
}

export function parseIsoDate(value) {
  const s = String(value || '').slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
