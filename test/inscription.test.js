import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import {
  applyFriendDefaults,
  buildDeciplusJobs,
  errorMessage,
  isDryRunRequest,
  validateInscription,
} from '../lib/inscription.js';
import { FRIEND_DEFAULT_ADDRESS, FRIEND_DEFAULT_BIRTHDATE, INFO_COMPTA_MENTION } from '../lib/constants.js';
import { nextVisitDate, toIsoDate } from '../lib/visit-date.js';
import { classifyRelance, getManager } from '../lib/relances.js';
import { resetMemoryLeads, saveLead } from '../lib/leads.js';

process.env.LEADS_BACKEND = 'memory';

const base = {
  prenom: 'Camille',
  nom: 'Durand',
  email: 'camille@example.com',
  tel: '06 12 34 56 78',
  naissance: '1994-05-12',
  sexe: 'F',
  salle: 'minimes',
  jour: 'lundi',
  rgpd: true,
  src: 'flyer',
};

describe('validateInscription', () => {
  it('accepte un prospect seul', () => {
    const r = validateInscription(base);
    assert.equal(r.ok, true);
    assert.equal(r.data.ami, null);
    assert.equal(r.data.gym.id, 'minimes');
  });

  it('refuse email / tel / salle / jour manquants', () => {
    const r = validateInscription({ prenom: 'A', nom: 'B' });
    assert.equal(r.ok, false);
    assert.ok(r.errors.includes('email'));
    assert.ok(r.errors.includes('tel'));
    assert.ok(r.errors.includes('salle'));
    assert.ok(r.errors.includes('jour'));
    assert.match(errorMessage(r.errors), /Email|Téléphone|Salle|Jour/i);
  });
});

describe('buildDeciplusJobs', () => {
  it('crée 1 job sans vente, adresse salle pour le principal', () => {
    const parsed = validateInscription(base);
    const { jobs } = buildDeciplusJobs(parsed.data, { orderId: 'SO-1' });
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].sale_type, 'none');
    assert.equal(jobs[0].create_sale, false);
    assert.equal(jobs[0].payment.amount, 0);
    assert.equal(jobs[0].info_compta, INFO_COMPTA_MENTION);
    assert.equal(jobs[0].customer.address, '12 rue de Fenouillet');
    assert.equal(jobs[0].customer.postal_code, '31200');
    assert.equal(jobs[0].is_friend_referral, false);
  });

  it('crée 2 jobs et applique les défauts ami', () => {
    const parsed = validateInscription({
      ...base,
      ami: { prenom: 'Alex', nom: 'Martin', email: 'alex@example.com', tel: '06 98 76 54 32', sexe: 'H' },
    });
    assert.equal(parsed.ok, true);
    assert.equal(parsed.data.ami.naissance, FRIEND_DEFAULT_BIRTHDATE);
    assert.equal(parsed.data.ami.address, FRIEND_DEFAULT_ADDRESS.address);
    const { jobs } = buildDeciplusJobs(parsed.data, { orderId: 'SO-2' });
    assert.equal(jobs.length, 2);
    const ami = jobs[1];
    assert.equal(ami.is_friend_referral, true);
    assert.equal(ami.customer.birthdate, '2000-01-01');
    assert.equal(ami.customer.address, '10 Avenue du Grand Ramier');
    assert.equal(ami.customer.postal_code, '31400');
    assert.equal(ami.customer.city, 'Toulouse');
    assert.equal(ami.sale_type, 'none');
    assert.equal(ami.info_compta, INFO_COMPTA_MENTION);
  });

  it('ne remplace pas une naissance ami déjà renseignée', () => {
    const friend = applyFriendDefaults({
      prenom: 'Alex',
      nom: 'Martin',
      email: 'alex@example.com',
      tel: '0698765432',
      sexe: 'H',
      naissance: '1998-03-04',
    });
    assert.equal(friend.naissance, '1998-03-04');
    assert.equal(friend.birthdate_defaulted, false);
  });
});

describe('nextVisitDate', () => {
  it('garde aujourd’hui si le jour choisi est aujourd’hui', () => {
    const monday = new Date(2026, 7, 17); // 17 août 2026 = lundi
    assert.equal(monday.getDay(), 1);
    assert.equal(toIsoDate(nextVisitDate('lundi', monday)), '2026-08-17');
  });

  it('prend le prochain samedi, pas un jour passé', () => {
    const monday = new Date(2026, 7, 17);
    assert.equal(toIsoDate(nextVisitDate('samedi', monday)), '2026-08-22');
  });
});

describe('dry-run', () => {
  it('détecte ?test=1 et le header', () => {
    assert.equal(isDryRunRequest({ query: { test: '1' } }), true);
    assert.equal(isDryRunRequest({ headers: { 'x-dry-run': '1' } }), true);
    assert.equal(isDryRunRequest({ body: { dry_run: true } }), true);
    assert.equal(isDryRunRequest({}), false);
  });
});

describe('relances', () => {
  before(() => resetMemoryLeads());
  after(() => resetMemoryLeads());

  it('relance prospect à J+1 sans vente', () => {
    const lead = {
      id: 'L1',
      visit_date: '2026-08-16',
      has_sale: false,
      salle: 'minimes',
      prenom: 'Camille',
    };
    const d = classifyRelance(lead, new Date(2026, 7, 17, 10, 0, 0));
    assert.equal(d.action, 'prospect');
  });

  it('n’envoie rien s’il y a une vente', () => {
    const d = classifyRelance(
      { id: 'L2', visit_date: '2026-08-16', has_sale: true, salle: 'minimes' },
      new Date(2026, 7, 20)
    );
    assert.equal(d.action, 'skip');
    assert.equal(d.reason, 'has_sale');
  });

  it('notifie le manager 72h après la relance prospect', () => {
    const d = classifyRelance(
      {
        id: 'L3',
        visit_date: '2026-08-16',
        has_sale: false,
        salle: 'portet',
        prospect_relance_at: '2026-08-17T08:00:00.000Z',
      },
      new Date('2026-08-20T09:00:00.000Z')
    );
    assert.equal(d.action, 'manager');
    assert.equal(d.manager.nom, 'Valentin');
  });

  it('signale un manager introuvable', () => {
    const d = classifyRelance(
      {
        id: 'L4',
        visit_date: '2026-08-16',
        salle: 'inconnue',
        prospect_relance_at: '2026-08-17T08:00:00.000Z',
      },
      new Date('2026-08-20T09:00:00.000Z')
    );
    assert.equal(d.action, 'error');
    assert.equal(d.reason, 'manager_unknown');
  });

  it('connaît les 5 managers', () => {
    assert.equal(getManager('minimes').nom, 'MEHDI');
    assert.equal(getManager('st-cyprien').nom, 'DADI');
    assert.equal(getManager('ramonville').nom, 'Pascal');
    assert.equal(getManager('etats-unis').nom, 'Sébastien');
    assert.equal(getManager('portet').nom, 'Valentin');
  });

  it('persiste un lead mémoire', async () => {
    const row = await saveLead({ id: 'MEM-1', prenom: 'Test', status: 'queued' });
    assert.equal(row.id, 'MEM-1');
  });
});
