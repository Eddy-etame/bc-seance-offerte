import {
  FRIEND_DEFAULT_ADDRESS,
  FRIEND_DEFAULT_BIRTHDATE,
  INFO_COMPTA_MENTION,
  JOURS,
  PRODUCT_ID,
  PRODUCT_NAME,
  RX_MAIL,
  RX_TEL,
  SALLE_IDS,
  SOURCE,
} from './constants.js';
import { getGym } from './gyms.js';
import { nextVisitDate, toIsoDate } from './visit-date.js';

function clean(v, max = 120) {
  return String(v || '')
    .trim()
    .slice(0, max);
}

function normalizeEmail(v) {
  const e = clean(v, 180).toLowerCase();
  return RX_MAIL.test(e) ? e : '';
}

function normalizePhone(v) {
  const raw = clean(v, 24);
  if (!RX_TEL.test(raw)) return '';
  return raw.replace(/\s+/g, ' ').trim();
}

function validBirthdate(v, { required = true } = {}) {
  const s = clean(v, 16);
  if (!s) return required ? '' : '';
  const d = new Date(s);
  if (Number.isNaN(+d)) return '';
  const age = (Date.now() - +d) / 31557600000;
  if (age < 3 || age > 100) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseAddress(gym) {
  return {
    address: gym.address,
    postal_code: gym.postal_code,
    city: gym.city,
    country: 'FR',
  };
}

export function applyFriendDefaults(ami = {}) {
  const birthdate = validBirthdate(ami.naissance || ami.birthdate, { required: false });
  return {
    prenom: clean(ami.prenom || ami.a_prenom || ami.first_name),
    nom: clean(ami.nom || ami.a_nom || ami.last_name),
    email: normalizeEmail(ami.email || ami.a_email),
    tel: normalizePhone(ami.tel || ami.a_tel || ami.phone),
    sexe: clean(ami.sexe || ami.a_sexe || ami.gender, 4).toUpperCase(),
    naissance: birthdate || FRIEND_DEFAULT_BIRTHDATE,
    birthdate_defaulted: !birthdate,
    address_defaulted: true,
    ...FRIEND_DEFAULT_ADDRESS,
  };
}

export function isDryRunRequest({ headers = {}, query = {}, body = {} } = {}) {
  if (process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true') return true;
  const header = String(headers['x-dry-run'] || headers['X-Dry-Run'] || '').trim();
  if (header === '1' || header.toLowerCase() === 'true') return true;
  const q = String(query.test || query.dry_run || '').trim();
  if (q === '1' || q === 'true') return true;
  return body.dry_run === true || body.test === true || body.test === '1';
}

export function validateInscription(body = {}) {
  const errors = [];
  const gym = getGym(body.salle);
  if (!gym || !SALLE_IDS.includes(gym.id)) errors.push('salle');
  if (!JOURS[String(body.jour || '').toLowerCase()]) errors.push('jour');

  const prenom = clean(body.prenom);
  const nom = clean(body.nom);
  const email = normalizeEmail(body.email);
  const tel = normalizePhone(body.tel || body.telephone || body.phone);
  const naissance = validBirthdate(body.naissance || body.birthdate, { required: true });
  const sexe = clean(body.sexe || body.gender, 4).toUpperCase();

  if (prenom.length < 2) errors.push('prenom');
  if (nom.length < 2) errors.push('nom');
  if (!email) errors.push('email');
  if (!tel) errors.push('tel');
  if (!naissance) errors.push('naissance');
  if (!['F', 'H', 'A', 'M'].includes(sexe)) errors.push('sexe');
  if (!body.rgpd && body.rgpd !== true) errors.push('rgpd');

  let ami = null;
  const rawAmi = body.ami;
  if (rawAmi && typeof rawAmi === 'object') {
    const friend = applyFriendDefaults(rawAmi);
    if (friend.prenom.length < 2) errors.push('ami.prenom');
    if (friend.nom.length < 2) errors.push('ami.nom');
    if (!friend.email) errors.push('ami.email');
    if (!friend.tel) errors.push('ami.tel');
    if (!['F', 'H', 'A', 'M'].includes(friend.sexe)) errors.push('ami.sexe');
    ami = friend;
  }

  if (errors.length) return { ok: false, errors };

  const visit = nextVisitDate(body.jour);
  return {
    ok: true,
    errors: [],
    data: {
      prenom,
      nom,
      email,
      tel,
      naissance,
      sexe,
      salle: gym.id,
      gym,
      jour: String(body.jour).toLowerCase(),
      jour_nom: JOURS[String(body.jour).toLowerCase()].nom,
      visit_date: toIsoDate(visit),
      src: clean(body.src || body.source || 'direct', 40),
      ami,
      rgpd: true,
    },
  };
}

function customerFromPerson(person, address) {
  return {
    first_name: person.prenom,
    last_name: person.nom,
    email: person.email,
    phone: person.tel,
    birthdate: person.naissance,
    gender: person.sexe,
    address: address.address,
    postal_code: address.postal_code,
    city: address.city,
    country: address.country || 'FR',
  };
}

function baseJob({ orderId, person, address, data, isFriend }) {
  return {
    order_id: orderId,
    action: 'sale',
    product_id: PRODUCT_ID,
    product_name: PRODUCT_NAME,
    offer: PRODUCT_NAME,
    sale_type: 'none',
    create_sale: false,
    requires_iban: false,
    requires_payment: false,
    gym: data.salle,
    is_friend_referral: Boolean(isFriend),
    info_compta: INFO_COMPTA_MENTION,
    visit_date: data.visit_date,
    visit_weekday: data.jour,
    customer: customerFromPerson(person, address),
    payment: {
      amount: 0,
      status: 'paid',
      method: 'offert',
    },
    utm: {
      source: data.src,
      medium: 'seance-offerte',
      campaign: 'essai-gratuite-web',
    },
    source: SOURCE,
  };
}

export function buildDeciplusJobs(data, { orderId } = {}) {
  const id = orderId || `SO-${Date.now()}`;
  const principal = baseJob({
    orderId: id,
    person: data,
    address: parseAddress(data.gym),
    data,
    isFriend: false,
  });
  const jobs = [principal];
  if (data.ami) {
    jobs.push(
      baseJob({
        orderId: `${id}-ami`,
        person: data.ami,
        address: FRIEND_DEFAULT_ADDRESS,
        data,
        isFriend: true,
      })
    );
  }
  return { orderId: id, jobs };
}

export function errorMessage(errors = []) {
  const map = {
    salle: 'Salle non renseignée.',
    jour: 'Jour de venue non renseigné.',
    prenom: 'Prénom invalide.',
    nom: 'Nom invalide.',
    email: 'Email invalide.',
    tel: 'Téléphone invalide.',
    naissance: 'Date de naissance invalide.',
    sexe: 'Sexe non renseigné.',
    rgpd: 'Consentement requis.',
    'ami.prenom': 'Prénom de l’ami(e) invalide.',
    'ami.nom': 'Nom de l’ami(e) invalide.',
    'ami.email': 'Email de l’ami(e) invalide.',
    'ami.tel': 'Téléphone de l’ami(e) invalide.',
    'ami.sexe': 'Sexe de l’ami(e) non renseigné.',
  };
  return errors.map((e) => map[e] || e).join(' ');
}
