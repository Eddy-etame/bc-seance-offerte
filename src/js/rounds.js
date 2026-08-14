/* ============================================================
   LES ROUNDS — la page se lit comme un combat en cinq reprises.
   Le rail suit le défilement ; au passage d'un round, la cloche :
   un éclair blanc très bref, et un coup de gong si le son est actif.
   ============================================================ */

import { bell } from "./audio.js";

let ticking = false;
let cleanup = [];

export function mountRounds(rail, sections) {
  unmountRounds();
  if (!rail || !sections.length) return;

  const items = [...rail.querySelectorAll(".rounds__item")];
  const fill = rail.querySelector(".rounds__fill");
  const flash = document.querySelector(".bellflash");
  let last = -1;

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

    if (idx === last) return;

    items.forEach((it, i) => {
      it.classList.toggle("is-on", i === idx);
      it.classList.toggle("is-done", i < idx);
    });

    if (idx > last && last >= 0) ring(rail, flash);
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
