/* ============================================================
   RÉVÉLATIONS
   Le contenu est visible par défaut ; on ne le cache que si on est
   sûr de savoir le montrer. Un observateur muet — onglet ouvert en
   arrière-plan, navigateur ancien — laisserait sinon une page vide.
   Filet de sécurité : si rien n'est révélé en 2 s, on démonte l'effet.
   ============================================================ */

let io = null;
let watchdog = 0;

export function mountReveal(root = document) {
  if (io) io.disconnect();
  clearTimeout(watchdog);

  const targets = root.querySelectorAll("[data-rv]");
  if (!("IntersectionObserver" in window)) {
    document.documentElement.classList.remove("rv-on");
    return;
  }
  document.documentElement.classList.add("rv-on");

  let seen = 0;
  io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add("is-in");
        seen += 1;
        io.unobserve(en.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.06 }
  );
  targets.forEach((el) => io.observe(el));

  watchdog = setTimeout(() => {
    if (seen === 0) document.documentElement.classList.remove("rv-on");
  }, 2000);
}

/** Fondu des photos une fois décodées ; une image en échec ne laisse pas de trou. */
export function mountImages(root = document) {
  root.querySelectorAll(".ph img:not(.ph__lqip)").forEach((img) => {
    const show = () => img.classList.add("is-in");
    if (img.complete && img.naturalWidth) show();
    else {
      img.addEventListener("load", show, { once: true });
      img.addEventListener("error", () => img.remove(), { once: true });
    }
  });
}
