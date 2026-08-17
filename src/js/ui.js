/* ============================================================
   OUTILS DE RENDU — échappement et images
   ============================================================ */

import IMG from "../img-manifest.json";

/* Typographie française : les ponctuations doubles prennent une espace
   INSÉCABLE avant, sinon le signe part seul en début de ligne au moindre
   retour — « venir
? ». L'usage de l'Imprimerie nationale : espace fine
   insécable devant ; ! ? et le guillemet fermant, espace insécable pleine
   devant les deux-points.
   C'est branché dans l'échappement pour que toute copie future soit
   correcte sans qu'on y pense — 34 textes visibles étaient fautifs. */
const FINE = " ";   // espace fine insécable
const NBSP = " ";   // espace insécable

export function fr(t) {
  return String(t ?? "")
    // On rend insécable une espace DÉJÀ écrite ; on n'en insère jamais.
    // Sinon « 19:40 » devient « 19 :40 » et l'heure se casse en deux.
    .replace(/ +:/g, NBSP + ":")
    .replace(/ +([;!?»])/g, FINE + "$1")
    .replace(/« +/g, "«" + FINE);
}

export const esc = (s) =>
  fr(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/** Image responsive : LQIP flou dessous, srcset dessus, jamais de saut de mise en page.
 *
 *  Direction artistique par format quand l'image en a une : un cliché
 *  paysage servi plein cadre sur un écran de 390x844 est rogné à un
 *  cinquième de sa largeur — il ne reste ni sujet ni composition, juste une
 *  bande. Les héros portent donc un cadrage portrait taillé à la main sur
 *  leur sujet, servi sous 700 px. */
export function pic(slug, { sizes = "100vw", ratio = "", cls = "", eager = false } = {}) {
  const m = IMG[slug];
  if (!m) {
    if (import.meta.env && import.meta.env.DEV) console.warn("[image] slug inconnu :", slug);
    return "";
  }
  const jeu = (o) => o.widths.map((w) => `${o.src}-${w}.webp ${w}w`).join(", ");
  const fallback = `${m.src}-${m.widths[m.widths.length - 1]}.webp`;
  const p = m.portrait;
  const source = p
    ? `<source media="(max-width: 700px)" srcset="${jeu(p)}" sizes="${sizes}" width="${p.w}" height="${p.h}" />`
    : "";
  const flou = p
    ? `<img class="ph__lqip ph__lqip--large" src="${m.lqip}" alt="" aria-hidden="true" />
       <img class="ph__lqip ph__lqip--petit" src="${p.lqip}" alt="" aria-hidden="true" />`
    : `<img class="ph__lqip" src="${m.lqip}" alt="" aria-hidden="true" />`;
  return `<div class="ph ph--grade ${cls}"${ratio ? ` style="aspect-ratio:${ratio}"` : ""}>
    ${flou}
    <picture>${source}
      <img src="${fallback}" srcset="${jeu(m)}" sizes="${sizes}"
           width="${m.w}" height="${m.h}" alt="${esc(m.alt)}"
           ${eager ? 'fetchpriority="high" decoding="sync"' : 'loading="lazy" decoding="async"'} />
    </picture>
  </div>`;
}

export const prefersCalm = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const scrollTo = (el) => {
  if (!el) return;
  el.scrollIntoView({ behavior: prefersCalm() ? "auto" : "smooth", block: "start" });
};

/** Découpe un titre en lignes masquées : chacune monte derrière sa fenêtre
    au lieu d'apparaître en fondu. Les titres de section se révélaient tous
    de la même façon que le reste — un fondu uniforme, la texture même du
    « c'est juste là ». Le texte passé ici doit être déjà échappé. */
export function lignes(html) {
  return fr(html)
    .split(/<br\s*\/?>/i)
    .map((l) => `<span class="mask"><span>${l.trim()}</span></span>`)
    .join("");
}
