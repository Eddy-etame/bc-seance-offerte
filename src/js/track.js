/* ============================================================
   TRAÇAGE (§18) — la source suit le prospect de bout en bout.
   Chaque QR imprimé porte son paramètre : essai.boxingcenter.fr/?src=flyer
   La valeur est mémorisée pour la session, même si l'URL est nettoyée.
   Le branchement réel (GA4 / Meta / webhook) se pose sur `track()`
   et nulle part ailleurs.
   ============================================================ */

import { SOURCES } from "./data.js";

const KEY = "bc-essai-src";

function readSource() {
  const p = new URLSearchParams(location.search);
  const raw = (p.get("src") || p.get("utm_source") || "").toLowerCase().trim();
  if (raw) {
    try { sessionStorage.setItem(KEY, raw); } catch { /* mode privé */ }
    return raw;
  }
  try { return sessionStorage.getItem(KEY) || "direct"; } catch { return "direct"; }
}

export const SOURCE = readSource();
/* Une source inconnue est affichée telle quelle en mode maquette, mais
   nettoyée : on ne recopie pas n'importe quoi depuis l'URL, même échappé. */
export const SOURCE_LABEL =
  SOURCES[SOURCE] ||
  (SOURCE === "direct"
    ? "Accès direct"
    : SOURCE.replace(/[^a-z0-9 _-]/gi, "").slice(0, 24) || "Source inconnue");

/** Numéro de laissez-passer, dérivé de la source : le flyer scanné a son numéro à l'écran. */
export const PASS_NO = (() => {
  const p = new URLSearchParams(location.search);
  const camp = (p.get("c") || p.get("utm_campaign") || "").replace(/[^a-z0-9]/gi, "").slice(0, 5);
  /* Le préfixe est montré au visiteur : il ne doit contenir que des lettres.
     Sans filtre, un ?src= fantaisiste produisait « N° <IM-7643 » ou
     « N° " O-4205 » — aucune injection possible, l'échappement tient, mais
     du caractère parasite dans un identifiant qu'on affiche. */
  const propre = (SOURCE === "direct" ? "web" : SOURCE).replace(/[^a-z]/gi, "");
  const base = (propre || "web").slice(0, 3).toUpperCase();
  const seed = camp || SOURCE;
  const n = (Math.abs([...seed].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7)) % 9000) + 1000;
  return `${base}-${n}`;
})();

export function track(event, data = {}) {
  const payload = { event: "bc_" + event, source: SOURCE, ...data };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  if (import.meta.env && import.meta.env.DEV) console.info("[suivi]", payload);
}
