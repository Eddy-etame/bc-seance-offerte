/* ============================================================
   OUTILS DE RENDU — échappement et images
   ============================================================ */

import IMG from "../img-manifest.json";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/** Image responsive : LQIP flou dessous, srcset dessus, jamais de saut de mise en page. */
export function pic(slug, { sizes = "100vw", ratio = "", cls = "", eager = false } = {}) {
  const m = IMG[slug];
  if (!m) {
    if (import.meta.env && import.meta.env.DEV) console.warn("[image] slug inconnu :", slug);
    return "";
  }
  const srcset = m.widths.map((w) => `${m.src}-${w}.webp ${w}w`).join(", ");
  const fallback = `${m.src}-${m.widths[m.widths.length - 1]}.webp`;
  return `<div class="ph ph--grade ${cls}"${ratio ? ` style="aspect-ratio:${ratio}"` : ""}>
    <img class="ph__lqip" src="${m.lqip}" alt="" aria-hidden="true" />
    <img src="${fallback}" srcset="${srcset}" sizes="${sizes}"
         width="${m.w}" height="${m.h}" alt="${esc(m.alt)}"
         ${eager ? 'fetchpriority="high" decoding="sync"' : 'loading="lazy" decoding="async"'} />
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
  return String(html)
    .split(/<br\s*\/?>/i)
    .map((l) => `<span class="mask"><span>${l.trim()}</span></span>`)
    .join("");
}
