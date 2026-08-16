/* ============================================================
   LES ROUNDS — la page se lit comme un combat en cinq reprises.
   Le rail suit le défilement ; au passage d'un round, la cloche :
   un éclair blanc très bref, et un coup de gong si le son est actif.
   ============================================================ */

import { bell } from "./audio.js";
import { ROUNDS } from "./data.js";
import { prefersCalm } from "./ui.js";

let ticking = false;
let cleanup = [];

export function mountRounds(rail, sections) {
  unmountRounds();
  if (!rail || !sections.length) return;

  const items = [...rail.querySelectorAll(".rounds__item")];
  const fill = rail.querySelector(".rounds__fill");
  const flash = document.querySelector(".bellflash");
  let last = -1;
  let pose = false;   // vrai une fois la première mesure faite

  const update = () => {
    ticking = false;
    const mid = window.scrollY + window.innerHeight * 0.42;

    let idx = -1;
    for (let i = 0; i < sections.length; i += 1) {
      if (sections[i].offsetTop <= mid) idx = i;
    }

    // avancement dans le round en cours
    if (fill) {
      const cur = sections[Math.max(0, idx)];
      const next = sections[Math.max(0, idx) + 1];
      const start = cur ? cur.offsetTop : 0;
      const end = next ? next.offsetTop : document.body.scrollHeight;
      const p = Math.min(1, Math.max(0, (mid - start) / Math.max(1, end - start)));
      fill.style.height = (p * 100).toFixed(1) + "%";
    }

    /* Le drapeau se pose AVANT le retour anticipé : au montage,
       idx vaut -1 comme last, on sortait d'ici sans jamais le poser —
       et la première annonce était perdue. */
    const premier = !pose;
    pose = true;
    if (idx === last) return;

    items.forEach((it, i) => {
      it.classList.toggle("is-on", i === idx);
      it.classList.toggle("is-done", i < idx);
    });

    /* On annonce dès qu'on avance d'un round, y compris quand on saute
       plusieurs sections d'un coup — mais jamais au tout premier calcul,
       sinon la pancarte tombe au chargement. */
    if (!premier && idx > last) {
      ring(rail, flash);
      annoncer(idx);
    }
    last = idx;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  cleanup.push(() => window.removeEventListener("scroll", onScroll));
  cleanup.push(() => window.removeEventListener("resize", onScroll));
  update();
}

export function unmountRounds() {
  cleanup.forEach((f) => f());
  cleanup = [];
  clearTimeout(minuteur);
  document.getElementById("annonce-round")?.classList.remove("is-on");
}

/* L'annonce du round — la pancarte du speaker.
   Elle passe, elle tient une seconde, elle repart. C'est le seul
   endroit de la page où quelque chose se produit sans qu'on l'ait
   demandé : il fallait que ce soit court, et que ça dise où on en est. */
let minuteur = 0;
function annoncer(idx) {
  const r = ROUNDS[idx];
  const el = document.getElementById("annonce-round");
  if (!r || !el || prefersCalm()) return;

  el.querySelector(".pancarte__n").textContent = r.n;
  el.querySelector(".pancarte__l").textContent = r.label;

  clearTimeout(minuteur);
  el.classList.remove("is-on");
  void el.offsetWidth;               // on redémarre l'animation
  el.classList.add("is-on");
  minuteur = setTimeout(() => el.classList.remove("is-on"), 2100);
}

function ring(rail, flash) {
  rail.classList.remove("is-ringing");
  void rail.offsetWidth;
  rail.classList.add("is-ringing");
  if (flash) {
    flash.classList.remove("is-on");
    void flash.offsetWidth;
    flash.classList.add("is-on");
  }
  bell();
}
