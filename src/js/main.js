/* ============================================================
   MONTAGE DE LA PAGE
   Un seul moteur de conversion, trois habillages.
   Direction : sélecteur, touches 1 / 2 / 3, ou ?dir=a|b|c
   ============================================================ */

import "../styles/index.css";
import {
  OFFRE, SALLES, JOURS, PEURS, CHAPITRES, HEROS, HERO_PREUVES,
  ANNONCE, AVIS, ROUNDS,
} from "./data.js";
import AFFICHES from "../plannings-manifest.json";
import { esc, pic, scrollTo } from "./ui.js";
import { formHTML, mountForm, skipKnownSteps, state } from "./form.js";
import { track, SOURCE_LABEL, PASS_NO } from "./track.js";
import { mountReveal, mountImages } from "./reveal.js";
import { mountLight, unmountLight, strikeLight } from "./light.js";
import { mountRounds, unmountRounds } from "./rounds.js";
import { setSound, restoreSound, isOn } from "./audio.js";

const app = document.getElementById("app");
const dock = document.getElementById("dock");
const DIRS = ["a", "b", "c"];

/* Mode propre : `?nu=1` retire le sélecteur de direction et le bouton son.
   C'est la page telle qu'elle sera en ligne — de quoi la montrer au client
   sans lui expliquer que ces boutons n'existeront pas. */
const NU = new URLSearchParams(location.search).get("nu") === "1";
if (NU) document.documentElement.classList.add("nu");

/* ============================================================
   BLOCS
   ============================================================ */

function passHTML(cls) {
  return `
  <div class="pass ${cls}">
    <div class="pass__stub"><span>Séance d'essai offerte · Boxing Center</span></div>
    <div class="pass__body">
      <div class="pass__top">
        <img class="pass__logo" src="/img/logo-bc-papier-260.webp" srcset="/img/logo-bc-papier-260.webp 260w, /img/logo-bc-papier-520.webp 520w" sizes="108px" width="3542" height="1653" alt="Boxing Center" />
        <span>N° ${esc(PASS_NO)}</span>
      </div>
      <p class="pass__title">Laissez-passer<br>une séance</p>
      <p class="pass__sub">Valable une entrée · toutes disciplines</p>
      <dl class="pass__lines">
        <div class="pass__row pass__row--valeur"><dt>Valeur</dt><i class="lead"></i><dd class="hot"><s>10 €</s>0 €</dd></div>
        <div class="pass__row"><dt>Salle</dt><i class="lead"></i><dd class="todo" data-pass="salle">à compléter</dd></div>
        <div class="pass__row"><dt>Jour</dt><i class="lead"></i><dd class="todo" data-pass="jour">à compléter</dd></div>
        <div class="pass__row"><dt>Au nom de</dt><i class="lead"></i><dd class="todo" data-pass="nom">à compléter</dd></div>
        <div class="pass__row"><dt>Accompagné</dt><i class="lead"></i><dd class="todo" data-pass="ami">à compléter</dd></div>
      </dl>
      <div class="pass__foot">
        <span class="pass__code" aria-hidden="true"></span>
      </div>
    </div>
    <span class="pass__stamp">Offerte<small>10 € → 0 €</small></span>
  </div>`;
}

function heroHTML(dir) {
  const h = HEROS[dir];
  const prix = `
    <p class="price">
      <span class="price__old">${OFFRE.prixHabituel}</span>
      <span class="price__new">${OFFRE.prixOffert}</span>
      <span class="price__note">Séance d'essai habituellement à 10 €. Offerte sur ce lien.</span>
    </p>`;

  return `
  <header class="hero">
    <div class="hero__media">${pic(h.img, { sizes: "100vw", eager: true })}</div>
    <div class="hero__scrim"></div>

    <div class="hero__top">
      <img class="hero__logo" src="/img/logo-bc-sombre-520.webp" srcset="/img/logo-bc-sombre-260.webp 260w, /img/logo-bc-sombre-520.webp 520w" sizes="(min-width:760px) 186px, 132px" width="3542" height="1683" alt="Boxing Center" />
      <span class="hero__src">${esc(SOURCE_LABEL)}</span>
    </div>

    <div class="hero__body">
      <p class="hero__kicker">${esc(h.kicker)}</p>
      ${dir === "c" ? '<p class="ts c-only">19:02</p>' : ""}
      <h1>
        <span class="mask"><span>${esc(h.titre[0])}</span></span>
        <span class="mask"><span class="underline">${esc(h.titre[1])}</span></span>
      </h1>
      ${dir === "b" ? passHTML("pass-hero") : prix}
      <p class="hero__lede">${esc(h.lede)}</p>
      <div class="hero__acts">
        <button type="button" class="btn btn--primary" data-open-form>
          ${esc(OFFRE.ctaPrimaire)}<span class="btn__arrow" aria-hidden="true"></span>
        </button>
        <a class="btn btn--ghost" href="#salles" data-goto>Je choisis ma salle</a>
      </div>
      <ul class="hero__proof">${HERO_PREUVES.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>

    <span class="scrollcue" aria-hidden="true"><i></i>Défiler</span>
  </header>`;
}

function annonceHTML() {
  const run = `<span>${ANNONCE.map((a) => `${esc(a)} <b>·</b>`).join(" ")}</span>`;
  return `<div class="announce" aria-hidden="true"><div class="announce__track">${run}${run}</div></div>`;
}

function cadrageHTML() {
  return `
  <section class="sect sect--tight sect--solo" id="cadrage">
    <div class="shell">
      <div class="sect__head" data-rv>
        <span class="eyebrow" data-round="Round 01">${esc(OFFRE.cadrageTitre)}</span>
        <p class="cadrage__claim">Elle est à 10 € partout.<br>Ici elle est à <span class="tint">0 €</span>.</p>
        <p class="measure">${esc(OFFRE.cadrage)}</p>
        <span class="rule"></span>
      </div>
    </div>
  </section>`;
}

function peursHTML() {
  return `
  <section class="sect" id="reassurance">
    <span class="sect__mark" aria-hidden="true">02</span>
    <div class="shell">
      <div class="sect__head" data-rv>
        <span class="eyebrow" data-round="Round 02">Ce qui te retient</span>
        <h2>Huit raisons<br>de ne pas venir.</h2>
        <p>On les entend toutes les semaines à l'accueil. Aucune n'est ridicule. Aucune ne tient après une séance.</p>
      </div>
      <div class="fears">
        ${PEURS.map(
          (f, i) => `
          <article class="fear" data-rv>
            <span class="fear__n">${String(i + 1).padStart(2, "0")}</span>
            <p class="fear__q"><span class="fear__qw">${esc(f.q)}</span></p>
            <p class="fear__a">${esc(f.r)}${
              f.lien ? ` <a class="fear__link" href="${f.lien.href}" data-goto>${esc(f.lien.texte)}</a>.` : ""
            }</p>
          </article>`
        ).join("")}
      </div>
      <div class="act" data-rv>
        <button type="button" class="btn btn--primary" data-open-form>
          ${esc(OFFRE.ctaPrimaire)}<span class="btn__arrow" aria-hidden="true"></span>
        </button>
        <span class="act__note">Débutants acceptés · <b>matériel prêté</b></span>
      </div>
    </div>
  </section>`;
}

function chapitresHTML() {
  return `
  <section class="sect" id="reassurance">
    <span class="sect__mark" aria-hidden="true">02</span>
    <div class="shell">
      <div class="sect__head" data-rv>
        <span class="eyebrow">Ta première séance, minute par minute</span>
        <h2>Quarante-cinq minutes.<br>Rien d'autre à savoir.</h2>
        <p>On ne te promet pas que c'est accessible — on te montre ce qui se passe, dans l'ordre.</p>
      </div>
      <div class="chapters">
        ${CHAPITRES.map(
          (c, i) => `
          <article class="chapter" data-chap="${i}" data-rv>
            <div class="chapter__media">${pic(c.img, { sizes: "(min-width:820px) 360px, 100vw" })}</div>
            <div class="chapter__txt">
              <p class="ts">${esc(c.t)}</p>
              <h3>${esc(c.h)}</h3>
              <p>${esc(c.p)}</p>
              <p class="chapter__fear">Ce que ça règle · <b>${esc(c.q)}</b></p>
            </div>
          </article>`
        ).join("")}
      </div>
      <div class="act" data-rv>
        <button type="button" class="btn btn--primary" data-open-form>
          ${esc(OFFRE.ctaPrimaire)}<span class="btn__arrow" aria-hidden="true"></span>
        </button>
        <span class="act__note">Horaires illustratifs · à valider par le club</span>
      </div>
    </div>
  </section>`;
}

function sallesHTML() {
  return `
  <section class="sect" id="salles">
    <span class="sect__mark" aria-hidden="true">03</span>
    <div class="shell">
      <div class="sect__head" data-rv>
        <span class="eyebrow" data-round="Round 03">Cinq salles à Toulouse</span>
        <h2>Choisis la tienne.</h2>
        <p>Touche une salle : elle est reprise dans ton inscription, et le planning en dessous s'ouvre dessus. Tu ne tapes rien.</p>
      </div>
      <div class="doors" data-rv>
        ${SALLES.map(
          (s) => `
          <button type="button" class="door" data-salle="${s.id}" aria-pressed="false"
                  aria-label="Choisir Boxing Center ${esc(s.nom)} — ${esc(s.fait)}">
            ${pic(s.img, { sizes: "(min-width:1100px) 240px, (min-width:701px) 22vw, 66vw" })}
            <span class="door__flag" aria-hidden="true">Ta salle</span>
            <span class="door__pick" aria-hidden="true">✓</span>
            <span class="door__name">${esc(s.nom)}</span>
            <span class="door__meta">${esc(s.fait)}</span>
          </button>`
        ).join("")}
      </div>
      <div class="act" data-rv>
        <button type="button" class="btn btn--primary" data-open-form>
          ${esc(OFFRE.ctaPrimaire)}<span class="btn__arrow" aria-hidden="true"></span>
        </button>
        <span class="act__note" id="echo-salle">Aucune salle retenue pour l'instant</span>
      </div>
    </div>
  </section>`;
}

function planningsHTML() {
  return `
  <section class="sect" id="plannings">
    <span class="sect__mark" aria-hidden="true">04</span>
    <div class="shell">
      <div class="sect__head" data-rv>
        <span class="eyebrow" data-round="Round 04">Plannings officiels</span>
        <h2>Quel jour<br>tu peux venir ?</h2>
        <p>Pas besoin de réserver un cours précis : tu indiques un jour, l'équipe t'oriente à l'accueil. Le planning complet de la salle est juste en dessous.</p>
      </div>

      <div class="week__for" data-rv>
        <b id="week-salle">Minimes</b>
        <span id="week-saison">Saison 2026 — 2027</span>
        <a class="week__swap" href="#salles" data-goto>Changer de salle</a>
      </div>

      <div class="week" id="week" data-rv></div>
      <p class="legend" data-rv><span>Tu choisis salle + jour · pas l'heure</span></p>

      <div class="poster" data-rv>
        <div class="poster__tabs" id="poster-tabs" role="tablist" aria-label="Planning affiché"></div>
        <button type="button" class="poster__frame" id="poster-frame" aria-label="Agrandir le planning"></button>
      </div>

      <div class="act" data-rv>
        <button type="button" class="btn btn--primary" data-open-form>
          ${esc(OFFRE.ctaPrimaire)}<span class="btn__arrow" aria-hidden="true"></span>
        </button>
        <span class="act__note" id="echo-jour">Aucun jour retenu</span>
      </div>
    </div>
  </section>`;
}

/* L'affiche officielle du club, telle qu'elle est publiée : couleur par
   discipline, aucun nom de coach. On ne recompose rien, on ne devine rien. */
function posterPic(a, sizes) {
  const srcset = a.widths.map((w) => `/img/plannings/${a.slug}-${w}.webp ${w}w`).join(", ");
  const src = `/img/plannings/${a.slug}-${a.widths[a.widths.length - 1]}.webp`;
  return `<div class="ph"><img class="ph__lqip" src="${a.lqip}" alt="" aria-hidden="true" />
    <img src="${src}" srcset="${srcset}" sizes="${sizes}" width="${a.w}" height="${a.h}"
         loading="lazy" decoding="async"
         alt="Planning officiel Boxing Center — ${esc(a.label)}, saison 2026-2027" /></div>`;
}

function binomeHTML() {
  return `
  <section class="sect" id="binome">
    <div class="shell">
      <div class="duo">
        <div class="duo__media" data-rv>
          ${pic("cours-groupe", { sizes: "(min-width:900px) 50vw, 100vw", ratio: "4/3" })}
          <span class="duo__x" aria-hidden="true">×2</span>
        </div>
        <div class="duo__txt" data-rv>
          <span class="eyebrow">Venir à deux</span>
          <h2>Amène quelqu'un.<br>Sa séance aussi<br>est offerte.</h2>
          <p>La première raison pour laquelle on ne pousse jamais la porte d'une salle, ce n'est pas le prix. <strong>C'est d'y aller seul.</strong> Alors on enlève aussi cette raison-là.</p>
          <ul class="duo__how">
            <li><i>01</i><span>Tu ajoutes son prénom à la dernière étape.</span></li>
            <li><i>02</i><span>Sa salle et son jour reprennent les tiens.</span></li>
            <li><i>03</i><span>Vous recevez chacun votre confirmation.</span></li>
          </ul>
          <div class="act" style="margin-top:8px">
            <button type="button" class="btn btn--primary" data-open-form data-ami-intent>
              Je viens avec quelqu'un<span class="btn__arrow" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function preuveHTML() {
  return `
  <section class="sect" id="preuve">
    <div class="shell">
      <div class="sect__head" data-rv>
        <span class="eyebrow">Ce qu'en disent les adhérents</span>
        <h2>Pas nous.<br>Eux.</h2>
      </div>
      <div class="proof">
        <div class="score" data-rv>
          <span class="score__n">${esc(AVIS.note)}<small>/5</small></span>
          <span class="score__stars" aria-hidden="true">★★★★★</span>
          <span class="score__src">${AVIS.nombre} avis · ${esc(AVIS.source)}<br>${esc(AVIS.salle)}</span>
        </div>
        <div class="quotes">
          ${AVIS.quotes
            .map(
              (q, i) => `<figure class="quote" data-rv data-rv-delay="${i}">
                <blockquote>${esc(q.t)}</blockquote>
                <figcaption><b>${esc(q.a)}</b><span>${esc(AVIS.source)}</span></figcaption>
              </figure>`
            )
            .join("")}
        </div>
      </div>
      <div class="act" data-rv>
        <button type="button" class="btn btn--primary" data-open-form>
          ${esc(OFFRE.ctaPrimaire)}<span class="btn__arrow" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </section>`;
}

function inscriptionHTML(dir) {
  return `
  <section class="sect" id="inscription">
    <span class="sect__mark" aria-hidden="true">05</span>
    <div class="shell">
      <div class="sect__head" data-rv>
        <span class="eyebrow" data-round="Dernier round">Deux minutes</span>
        <h2>${dir === "b" ? "Complète<br>ton laissez-passer." : "Prends ta place<br>dans le coin."}</h2>
        <p>Six écrans courts. Les deux premiers se touchent — on ne tape rien avant d'avoir dit oui deux fois. Tu peux revenir en arrière à tout moment.</p>
      </div>
      <div class="form-layout" data-rv>
        ${formHTML()}
        ${dir === "b" ? `<aside class="pass-live">${passHTML("")}</aside>` : ""}
      </div>
    </div>
  </section>`;
}

function footHTML() {
  return `
  <footer class="foot">
    <div class="shell foot__in">
      <img class="foot__logo" src="/img/logo-bc-sombre-520.webp" srcset="/img/logo-bc-sombre-260.webp 260w, /img/logo-bc-sombre-520.webp 520w" sizes="158px" width="3542" height="1683" alt="Boxing Center" />
      <ul class="foot__list">
        <li>Débutants acceptés</li><li>Matériel prêté</li>
        <li>Cours encadrés</li><li>Sans obligation d'inscription</li>
      </ul>
      <p class="foot__note">Séance d'essai habituellement proposée à 10 €, offerte dans le cadre de cette opération.</p>
    </div>
  </footer>`;
}

function roundsHTML() {
  return `
  <nav class="rounds" aria-label="Progression">
    <div class="rounds__in">
      <span class="rounds__lab">Le combat</span>
      <div class="rounds__track"><span class="rounds__fill"></span><span class="rounds__bell"></span></div>
      <ol class="rounds__list">
        ${ROUNDS.map((r) => `<li class="rounds__item" title="${esc(r.label)}">${r.n}</li>`).join("")}
      </ol>
    </div>
  </nav>`;
}

/* ============================================================
   RENDU
   ============================================================ */

function render(dir) {
  document.documentElement.dataset.dir = dir;

  app.innerHTML =
    heroHTML(dir) +
    annonceHTML() +
    cadrageHTML() +
    (dir === "c" ? chapitresHTML() : peursHTML()) +
    sallesHTML() +
    planningsHTML() +
    binomeHTML() +
    preuveHTML() +
    inscriptionHTML(dir) +
    footHTML();

  document.getElementById("rail-slot").innerHTML =
    (dir === "a" ? roundsHTML() : "") +
    (dir === "c" ? `<div class="rail" aria-hidden="true">${CHAPITRES.map(() => "<i></i>").join("")}</div>` : "");

  document.querySelectorAll("[data-set-dir]").forEach((b) =>
    b.setAttribute("aria-checked", String(b.dataset.setDir === dir))
  );

  mountForm(app, sync);
  paintWeek(state.salle || SALLES[0].id);
  sync();

  mountReveal(document);
  mountImages(document);
  mountObservers(dir);

  track("page_vue", { direction: dir });
}

/* ============================================================
   ÉTAT PARTAGÉ — le choix suit le visiteur partout
   ============================================================ */

function sync() {
  const salle = SALLES.find((s) => s.id === state.salle);
  const jour = JOURS.find((j) => j.id === state.jour);
  const nom = [state.prenom, state.nom].filter(Boolean).join(" ");

  const vals = {
    salle: salle ? "Boxing Center " + salle.nom : "",
    jour: jour ? jour.nom : "",
    nom,
    ami: state.ami === null ? "" : state.ami ? "oui — offerte" : "non",
  };
  document.querySelectorAll("[data-pass]").forEach((el) => {
    const v = vals[el.dataset.pass];
    el.textContent = v || "à compléter";
    el.classList.toggle("todo", !v);
  });

  document.querySelectorAll("[data-salle]").forEach((d) =>
    d.setAttribute("aria-pressed", String(d.dataset.salle === state.salle))
  );
  document.querySelectorAll("[data-jour]").forEach((d) =>
    d.setAttribute("aria-pressed", String(d.dataset.jour === state.jour))
  );

  const eS = document.getElementById("echo-salle");
  if (eS) eS.innerHTML = salle ? `Salle retenue : <b>${esc(salle.nom)}</b>` : "Aucune salle retenue pour l'instant";
  const eJ = document.getElementById("echo-jour");
  if (eJ) eJ.innerHTML = jour ? `Jour retenu : <b>${esc(jour.nom)}</b>` : "Aucun jour retenu";
  const wS = document.getElementById("week-salle");
  if (wS && salle) wS.textContent = salle.nom;

  const dm = document.getElementById("dock-meta");
  if (dm) {
    const bits = [salle && salle.nom, jour && jour.nom].filter(Boolean);
    dm.textContent = bits.length ? bits.join(" · ") + " · " + OFFRE.dockNote : OFFRE.dockNote;
  }
}

function paintWeek(salleId) {
  const week = document.getElementById("week");
  if (week) {
    week.innerHTML = JOURS.map(
      (j) => `<button type="button" class="day" data-jour="${j.id}" aria-pressed="${state.jour === j.id}"
        aria-label="Je viens le ${esc(j.nom.toLowerCase())}">
        <span class="day__nom">${esc(j.court)}</span>
        <span class="day__long">${esc(j.nom)}</span>
        <span class="day__pick" aria-hidden="true">✓</span>
      </button>`
    ).join("");
  }

  const s = SALLES.find((x) => x.id === salleId);
  const wS = document.getElementById("week-salle");
  if (wS && s) wS.textContent = s.nom;

  paintPoster(salleId, 0);
}

function paintPoster(salleId, index) {
  const tabs = document.getElementById("poster-tabs");
  const frame = document.getElementById("poster-frame");
  if (!tabs || !frame) return;

  const liste = AFFICHES[salleId] || [];
  if (!liste.length) {
    tabs.innerHTML = "";
    frame.innerHTML = `<p class="poster__vide">Planning de cette salle à venir.</p>`;
    return;
  }

  tabs.innerHTML =
    liste.length > 1
      ? liste
          .map(
            (a, i) =>
              `<button type="button" class="poster__tab" role="tab" data-poster="${i}"
                 aria-selected="${i === index}">${esc(a.label)}</button>`
          )
          .join("")
      : "";

  frame.innerHTML =
    posterPic(liste[index] || liste[0], "(min-width:900px) 940px, 96vw") +
    `<span class="poster__zoom">Agrandir</span>`;
  // Surtout pas `data-salle` : le gestionnaire des portes intercepterait le
  // clic et prendrait l'affiche pour un bouton de salle.
  frame.dataset.posterSalle = salleId;
  frame.dataset.posterIndex = String(index);
  mountImages(frame);
}

/* Plein écran : l'affiche est dense, elle doit pouvoir se lire en grand. */
function openPoster(salleId, index) {
  const a = (AFFICHES[salleId] || [])[index];
  if (!a) return;
  const lb = document.getElementById("lightbox");
  lb.innerHTML =
    `<button type="button" class="lightbox__close" aria-label="Fermer">Fermer</button>` +
    posterPic(a, "min(1400px, 96vw)");
  lb.hidden = false;
  document.body.style.overflow = "hidden";
  mountImages(lb);
  lb.querySelector(".lightbox__close").focus();
  track("planning_agrandi", { salle: salleId });
}

function closePoster() {
  const lb = document.getElementById("lightbox");
  if (!lb || lb.hidden) return;
  lb.hidden = true;
  lb.innerHTML = "";
  document.body.style.overflow = "";
}

/* ============================================================
   INTERACTIONS
   ============================================================ */

function openForm(withFriend) {
  skipKnownSteps(app);
  scrollTo(document.getElementById("inscription"));
  if (withFriend) setTimeout(() => document.querySelector('[data-ami="oui"]')?.click(), 620);
  track("cta_clic", { avec_ami: !!withFriend });
}

document.addEventListener("click", (e) => {
  const cta = e.target.closest("[data-open-form]");
  if (cta) { openForm(cta.hasAttribute("data-ami-intent")); return; }

  const goto = e.target.closest("[data-goto]");
  if (goto) {
    e.preventDefault();
    scrollTo(document.querySelector(goto.getAttribute("href")));
    return;
  }

  const door = e.target.closest("[data-salle]");
  if (door) {
    state.salle = door.dataset.salle;
    const opt = app.querySelector(`.opt[data-pick="salle"][data-val="${state.salle}"]`);
    if (opt) opt.parentElement.querySelectorAll(".opt").forEach((b) => b.setAttribute("aria-pressed", String(b === opt)));
    paintWeek(state.salle);
    sync();
    track("salle_choisie", { salle: state.salle });
    return;
  }

  const ptab = e.target.closest("[data-poster]");
  if (ptab) {
    paintPoster(state.salle || SALLES[0].id, Number(ptab.dataset.poster));
    return;
  }

  const frame = e.target.closest("#poster-frame");
  if (frame) { openPoster(frame.dataset.posterSalle, Number(frame.dataset.posterIndex)); return; }

  if (e.target.closest(".lightbox__close") || e.target.id === "lightbox") { closePoster(); return; }

  const day = e.target.closest("[data-jour]");
  if (day) {
    state.jour = day.dataset.jour;
    const opt = app.querySelector(`.opt[data-pick="jour"][data-val="${state.jour}"]`);
    if (opt) opt.parentElement.querySelectorAll(".opt").forEach((b) => b.setAttribute("aria-pressed", String(b === opt)));
    sync();
    track("jour_choisi", { jour: state.jour });
  }
});

/* ---------- barre collante ---------- */

let dockIO = null;
let dockFired = false;

function mountObservers(dir) {
  unmountLight();
  unmountRounds();
  dockIO && dockIO.disconnect();
  dockFired = false;

  if (dir !== "c") mountLight(document.querySelector(".light"));

  if (dir === "a") {
    const ids = ROUNDS.map((r) => document.getElementById(r.id)).filter(Boolean);
    mountRounds(document.querySelector(".rounds"), ids);
  }

  /* La barre collante ne doit jamais doubler un bouton déjà à l'écran :
     deux rouges identiques l'un sous l'autre, c'est la loi de l'économie
     des couleurs qui saute. Elle s'efface dès qu'un appel à l'action est
     visible, et revient sitôt qu'il sort du champ. */
  const anchors = [
    document.querySelector(".hero__acts"),
    ...document.querySelectorAll(".act"),
    // La section d'inscription entière : la barre y masquait les tuiles de
    // salle et doublait le bouton « Continuer ». C'est là que la conversion
    // se joue, on ne met rien devant.
    document.getElementById("inscription"),
  ].filter(Boolean);

  if (anchors.length && "IntersectionObserver" in window) {
    const visible = new Set();
    dockIO = new IntersectionObserver(
      (entries) => {
        dockFired = true;
        entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
        dock.classList.toggle("is-on", visible.size === 0 && window.scrollY > 60);
      },
      // La marge basse vaut la hauteur de la barre : un bouton caché DERRIÈRE
      // elle ne compte pas comme visible, un bouton juste au-dessus si.
      { threshold: 0, rootMargin: "-60px 0px -96px 0px" }
    );
    anchors.forEach((a) => dockIO.observe(a));
  }

  if (dir === "c") {
    const dots = [...document.querySelectorAll(".rail i")];
    const chaps = [...document.querySelectorAll("[data-chap]")];
    if (dots.length && chaps.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            const i = chaps.indexOf(en.target);
            dots.forEach((d, j) => d.classList.toggle("is-on", j === i));
          });
        },
        { threshold: 0.45 }
      );
      chaps.forEach((c) => io.observe(c));
    }
  }
}

// Secours : la barre est trop rentable pour dépendre d'une seule mécanique.
window.addEventListener("scroll", () => {
  if (dockFired) return;
  dock.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.7);
}, { passive: true });

/* ============================================================
   DIRECTION, SON, DÉMARRAGE
   ============================================================ */

function setDir(dir, remember = true) {
  if (!DIRS.includes(dir)) dir = "a";
  if (remember) {
    const u = new URL(location.href);
    u.searchParams.set("dir", dir);
    history.replaceState(null, "", u);
    try { localStorage.setItem("bc-essai-dir", dir); } catch { /* rien */ }
  }
  const y = window.scrollY;
  render(dir);
  window.scrollTo({ top: Math.min(y, document.body.scrollHeight), behavior: "auto" });
}

document.querySelector(".tools")?.addEventListener("click", (e) => {
  const d = e.target.closest("[data-set-dir]");
  if (d) { setDir(d.dataset.setDir); return; }
  const s = e.target.closest("[data-sound]");
  if (s) {
    const on = setSound(!isOn());
    s.setAttribute("aria-pressed", String(on));
    s.textContent = on ? "♪" : "♪̸";
    track("son", { actif: on });
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePoster();
  if (e.target.matches("input, select, textarea")) return;
  const map = { 1: "a", 2: "b", 3: "c" };
  if (map[e.key]) setDir(map[e.key]);
});

const urlDir = new URLSearchParams(location.search).get("dir");
let saved = null;
try { saved = localStorage.getItem("bc-essai-dir"); } catch { /* rien */ }

if (restoreSound()) {
  setSound(true);
  const b = document.querySelector("[data-sound]");
  if (b) { b.setAttribute("aria-pressed", "true"); b.textContent = "♪"; }
}

setDir(urlDir || saved || "a", false);

/* ---------- l'allumage, en deux temps ----------
   `lit`   : le script a la main, les états de départ s'appliquent.
   `shown` : on joue la séquence.
   Les deux sont posées par des minuteurs, qui tournent même dans un
   onglet d'arrière-plan. Sans script, aucune des deux n'existe et la
   page s'affiche entière : rien ne peut rester caché. */
const root = document.documentElement;
root.classList.add("lit");

let shown = false;
const reveal = () => {
  if (shown) return;
  shown = true;
  root.classList.add("shown");
  strikeLight(document.querySelector(".light"));
};
requestAnimationFrame(() => requestAnimationFrame(reveal));
setTimeout(reveal, 120);

// Verrou : passé ce délai, la séquence est terminée quoi qu'il arrive.
setTimeout(() => root.classList.add("settled"), 3000);
