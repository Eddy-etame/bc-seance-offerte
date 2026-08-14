/* ============================================================
   LA LUMIÈRE — le cône suit, la poussière flotte dedans.
   « La lumière est un objet, pas un fond » (standards de build).
   Sur pointeur : le faisceau se déplace, amorti. Sur mobile : il
   dérive doucement avec le défilement. La poussière est dessinée
   sur un canvas — une soixantaine de particules, rien de plus.
   ============================================================ */

import { prefersCalm } from "./ui.js";

let raf = 0;
let stopFns = [];

/* Le néon d'entrepôt : deux ratés, puis il tient.
   Séquence par minuteurs — ils s'exécutent même quand l'onglet ne
   compose pas, contrairement à une animation CSS qui resterait figée
   sur son image de départ, c'est-à-dire éteinte. */
export function strikeLight(el) {
  if (!el || prefersCalm()) return;
  const frames = [
    [0, "0"], [70, "0.9"], [150, "0.05"], [240, "1"],
    [330, "0.12"], [430, "0.8"], [560, "0.35"], [700, ""],
  ];
  frames.forEach(([t, v]) => setTimeout(() => { el.style.opacity = v; }, t));
}

export function mountLight(el) {
  unmountLight();
  if (!el) return;

  const beam = el.querySelector(".light__beam");
  const canvas = el.querySelector(".light__dust");
  if (!beam) return;

  /* — le faisceau suit le pointeur, avec de l'inertie — */
  let target = 50;
  let current = 50;

  const onMove = (e) => {
    target = (e.clientX / window.innerWidth) * 100;
    target = 32 + (target - 50) * 0.55; // amplitude contenue : la lampe est accrochée au plafond
  };
  const onScroll = () => {
    if (window.matchMedia("(pointer: fine)").matches) return;
    const p = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
    target = 40 + Math.sin(p * Math.PI * 2) * 12;
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  stopFns.push(() => window.removeEventListener("pointermove", onMove));
  stopFns.push(() => window.removeEventListener("scroll", onScroll));

  const follow = () => {
    current += (target - current) * 0.045;
    el.style.setProperty("--lx", current.toFixed(2) + "%");
    raf = requestAnimationFrame(follow);
  };

  if (!prefersCalm()) {
    raf = requestAnimationFrame(follow);
  } else {
    el.style.setProperty("--lx", "42%");
  }

  /* — la poussière — */
  if (canvas && !prefersCalm()) startDust(canvas, () => current);
}

export function unmountLight() {
  cancelAnimationFrame(raf);
  raf = 0;
  stopFns.forEach((f) => f());
  stopFns = [];
}

function startDust(canvas, getX) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  let w = 0, h = 0, dpr = 1, motes = [];

  const size = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = w < 700 ? 34 : 68;
    motes = Array.from({ length: n }, () => spawn(true));
  };

  function spawn(anywhere) {
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -10,
      r: 0.4 + Math.random() * 1.5,
      vy: 0.06 + Math.random() * 0.34,
      vx: (Math.random() - 0.5) * 0.16,
      a: 0.06 + Math.random() * 0.34,
      ph: Math.random() * Math.PI * 2,
    };
  }

  size();
  window.addEventListener("resize", size, { passive: true });
  stopFns.push(() => window.removeEventListener("resize", size));

  let t = 0, loop = 0;
  const tick = () => {
    t += 0.012;
    ctx.clearRect(0, 0, w, h);
    const cx = (getX() / 100) * w;
    const beamHalf = w * 0.34;

    for (const m of motes) {
      m.y += m.vy;
      m.x += m.vx + Math.sin(t + m.ph) * 0.16;
      if (m.y > h + 10) Object.assign(m, spawn(false), { y: -10 });

      // la poussière ne brille que dans le faisceau, et s'éteint vers le bas
      const d = Math.abs(m.x - cx) / beamHalf;
      const inBeam = Math.max(0, 1 - d * d);
      const fade = Math.max(0, 1 - m.y / (h * 0.92));
      const alpha = m.a * inBeam * fade;
      if (alpha <= 0.004) continue;

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,238,208,${alpha.toFixed(3)})`;
      ctx.fill();
    }
    loop = requestAnimationFrame(tick);
  };
  loop = requestAnimationFrame(tick);
  stopFns.push(() => cancelAnimationFrame(loop));

  // on ne dessine pas dans le vide quand l'onglet passe en arrière-plan
  const vis = () => {
    if (document.hidden) cancelAnimationFrame(loop);
    else loop = requestAnimationFrame(tick);
  };
  document.addEventListener("visibilitychange", vis);
  stopFns.push(() => document.removeEventListener("visibilitychange", vis));
}
