/* ============================================================
   LE SON — cloche de fin de round.
   « Sons opt-in uniquement » (standards de build) : rien ne se
   déclenche tant que le visiteur n'a pas cliqué le bouton. Aucun
   fichier audio : tout est synthétisé, zéro octet téléchargé.
   ============================================================ */

let ctx = null;
let on = false;

export const isOn = () => on;

export function setSound(next) {
  on = !!next;
  try { localStorage.setItem("bc-essai-son", on ? "1" : "0"); } catch { /* mode privé */ }
  if (on) {
    ensure();
    // un petit coup pour confirmer que c'est actif
    strike(0.18, 660, 0.5);
  }
  return on;
}

export function restoreSound() {
  try { return localStorage.getItem("bc-essai-son") === "1"; } catch { return false; }
}

function ensure() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

/** Cloche de ring : deux partiels métalliques et une longue traîne. */
export function bell() {
  if (!on) return;
  strike(0.9, 1180, 1);
}

/** Petit choc sourd quand une étape est validée. */
export function thud() {
  if (!on) return;
  const c = ensure();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(58, t + 0.16);
  g.gain.setValueAtTime(0.14, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + 0.24);
}

function strike(dur, freq, vol) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime;
  const out = c.createGain();
  out.gain.value = 0.16 * vol;
  out.connect(c.destination);

  [1, 2.76, 5.4].forEach((mult, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq * mult;
    const peak = 0.5 / (i + 1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (1 - i * 0.22));
    o.connect(g).connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  });
}
