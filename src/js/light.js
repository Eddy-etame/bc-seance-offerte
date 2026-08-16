/* ============================================================
   LA POURSUITE — le projecteur qui suit
   ------------------------------------------------------------
   La lumière EST le mécanisme de lecture :
   · la flaque descend avec le défilement comme un suiveur de
     salle qui accompagne quelqu'un vers le ring ;
   · le faisceau s'incline pour rester pointé dessus ;
   · une section reste éteinte tant que la lumière ne l'atteint
     pas — ce qu'elle ne touche pas, on ne le lit pas.

   COÛT — trois versions ont été nécessaires.
   1) Géométrie relue à chaque image sur neuf sections : 9 img/s.
      → mise en cache, recalculée seulement au redimensionnement.
   2) Faisceau et flaque en CSS avec `filter: blur()` : 11-16 img/s
      sur grand écran. Chromium re-trame un calque flouté à chaque
      changement de transformation, et le coût suit la surface.
      → toute la lumière est maintenant peinte dans UN canvas, à
      demi-résolution, en composition additive. Pas de filtre CSS,
      pas de mode de fusion, un seul calque.
   Le flou est imité par quatre cônes emboîtés de plus en plus
   larges et de plus en plus faibles : le résultat est plus doux
   qu'un vrai flou, pour une fraction du prix.
   ============================================================ */

import { prefersCalm } from "./ui.js";

let raf = 0;
let stop = [];
let stages = [];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function mountLight(el) {
  unmountLight();
  if (!el) return;

  stages = [...document.querySelectorAll("[data-stage]")];

  if (prefersCalm()) {
    stages.forEach((s) => s.style.setProperty("--lit", "1"));
    return;
  }

  const canvas = el.querySelector(".light__dust");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  /* — résolution réduite : la lumière est douce, personne ne verra la
       différence, et le remplissage chute d'autant. Plus l'écran est
       grand, plus on descend : à 2560 le coût suit la surface. — */
  let ECH = 0.5;
  let W = 0, H = 0, motes = [], plans = [];

  const ne = (partout) => ({
    x: Math.random() * W,
    y: partout ? Math.random() * H : -6,
    r: (0.5 + Math.random() * 1.4) * ECH,
    vy: (0.05 + Math.random() * 0.3) * ECH,
    vx: (Math.random() - 0.5) * 0.14 * ECH,
    a: 0.07 + Math.random() * 0.3,
    ph: Math.random() * Math.PI * 2,
  });

  const mesurer = () => {
    ECH = window.innerWidth > 1700 ? 0.34 : window.innerWidth > 1100 ? 0.44 : 0.5;
    W = Math.round(window.innerWidth * ECH);
    H = Math.round(window.innerHeight * ECH);
    canvas.width = W; canvas.height = H;
    motes = Array.from({ length: window.innerWidth < 700 ? 26 : 54 }, () => ne(true));
    plans = stages.map((s) => {
      let t = 0, n = s;
      while (n) { t += n.offsetTop; n = n.offsetParent; }
      return { el: s, haut: t, h: s.offsetHeight, lit: -1 };
    });
  };

  /* — cible et valeur amortie : la poursuite glisse, elle ne saute pas — */
  let cibleY = 0.5, y = 0.5, cibleX = 0.5, x = 0.5;
  let vitesse = 0, dernier = window.scrollY;

  const viser = () => {
    const sy = window.scrollY;
    const vh = window.innerHeight;
    vitesse = vitesse * 0.84 + (sy - dernier) * 0.16;
    dernier = sy;

    let best = 0.5, dist = Infinity;
    for (const p of plans) {
      const centre = p.haut + Math.min(p.h, vh) * 0.42 - sy;
      const d = Math.abs(centre - vh * 0.5);
      if (d < dist) { dist = d; best = centre / vh; }
    }
    // le suiveur devance légèrement : il regarde là où on va
    cibleY = clamp(best + clamp(vitesse / vh, -0.07, 0.07), 0.2, 0.78);
  };

  const onScroll = () => viser();
  const onResize = () => { mesurer(); viser(); };
  const onMove = (e) => { cibleX = 0.5 + (e.clientX / window.innerWidth - 0.5) * 0.4; };

  mesurer(); viser();
  y = cibleY; x = cibleX;

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  stop.push(() => window.removeEventListener("scroll", onScroll));
  stop.push(() => window.removeEventListener("resize", onResize));
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", onMove, { passive: true });
    stop.push(() => window.removeEventListener("pointermove", onMove));
  }
  const remesure = setTimeout(onResize, 1200); // la mise en page bouge quand les images arrivent
  stop.push(() => clearTimeout(remesure));

  /* — un cône : apex étroit en haut, ouverture sur la flaque — */
  function cone(cx, cy, largeur, alpha, incline) {
    /* La source est juste HORS CHAMP. Trop bas, l'apex se lit comme un
       coin découpé collé en haut d'écran ; trop haut, le cône devient
       parallèle et il ne reste qu'un halo sans direction. */
    const apex = -H * 0.14;
    const apexX = cx - incline * (cy - apex) * 0.4;
    const g = ctx.createLinearGradient(0, apex, 0, cy);
    g.addColorStop(0, `rgba(255,243,222,${(0.42 * alpha).toFixed(3)})`);
    g.addColorStop(0.3, `rgba(255,236,206,${(0.3 * alpha).toFixed(3)})`);
    g.addColorStop(0.62, `rgba(255,228,190,${(0.13 * alpha).toFixed(3)})`);
    g.addColorStop(1, "rgba(255,228,190,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(apexX - 2 * ECH, apex);
    ctx.lineTo(apexX + 2 * ECH, apex);
    ctx.lineTo(cx + largeur, cy);
    ctx.lineTo(cx - largeur, cy);
    ctx.closePath();
    ctx.fill();
  }

  const boucle = () => {
    y += (cibleY - y) * 0.04;
    x += (cibleX - x) * 0.045;

    const cx = x * W;
    const cy = y * H;
    const incline = (x - 0.5) * 0.5;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    // quatre cônes emboîtés : la douceur d'un flou, sans son prix
    const base = W * 0.15;
    cone(cx, cy, base * 2.1, 0.1, incline);
    cone(cx, cy, base * 1.6, 0.18, incline);
    cone(cx, cy, base * 1.25, 0.3, incline);
    cone(cx, cy, base * 1.0, 0.52, incline);

    // la flaque posée sur ce qu'on lit
    const rp = W * 0.42;
    const gp = ctx.createRadialGradient(cx, cy, 0, cx, cy, rp);
    gp.addColorStop(0, "rgba(255,232,196,0.3)");
    gp.addColorStop(0.42, "rgba(255,228,190,0.1)");
    gp.addColorStop(1, "rgba(255,228,190,0)");
    ctx.fillStyle = gp;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rp, H * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    // la poussière, seulement là où la lumière passe
    const demi = W * 0.3;
    for (const m of motes) {
      m.y += m.vy;
      m.x += m.vx + Math.sin(m.ph + performance.now() * 0.0004) * 0.09;
      if (m.y > H + 6) Object.assign(m, ne(false));
      const d = Math.abs(m.x - cx) / demi;
      const dedans = Math.max(0, 1 - d * d);
      const dessous = clamp(1 - (m.y - cy) / (H * 0.5), 0, 1);
      const alpha = m.a * dedans * dessous;
      if (alpha <= 0.006) continue;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,240,214,${alpha.toFixed(3)})`;
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";

    /* Ce que la lumière touche se lit ; le reste s'éteint.
       Aucune lecture du DOM ici — uniquement du cache et scrollY. */
    const sy = window.scrollY;
    const vh = window.innerHeight;
    const cibleAbs = y * vh;
    for (const p of plans) {
      const haut = p.haut - sy;
      if (haut > vh + 240 || haut + p.h < -240) continue;
      const centre = haut + Math.min(p.h, vh) * 0.42;
      const d = Math.abs(centre - cibleAbs) / (vh * 0.92);
      const lit = clamp(1 - d * d, 0.06, 1);
      if (Math.abs(lit - p.lit) > 0.01) {
        p.lit = lit;
        p.el.style.setProperty("--lit", lit.toFixed(3));
      }
    }

    raf = requestAnimationFrame(boucle);
  };
  raf = requestAnimationFrame(boucle);
  stop.push(() => cancelAnimationFrame(raf));

  const vis = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(boucle);
  };
  document.addEventListener("visibilitychange", vis);
  stop.push(() => document.removeEventListener("visibilitychange", vis));
}

export function unmountLight() {
  cancelAnimationFrame(raf);
  raf = 0;
  stop.forEach((f) => f());
  stop = [];
  stages.forEach((s) => s.style.removeProperty("--lit"));
  stages = [];
}

/* Le néon rate deux fois avant de tenir. Minuteurs, pas animation CSS :
   une animation en cours ne progresse pas dans un onglet qui ne compose
   pas et resterait figée sur son image de départ — donc éteinte. */
export function strikeLight(el) {
  if (!el || prefersCalm()) return;
  [[0, "0"], [70, "0.9"], [150, "0.05"], [240, "1"],
   [330, "0.12"], [430, "0.8"], [560, "0.35"], [700, ""]]
    .forEach(([t, v]) => setTimeout(() => { el.style.opacity = v; }, t));
}
