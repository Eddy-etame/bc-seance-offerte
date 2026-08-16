/* ============================================================
   LE FORMULAIRE EN SIX RESPIRATIONS
   8 champs imposés par Deciplus, jusqu'à 14 avec le binôme.
   Empilés sur un écran : ~7 % de complétion (HubSpot, 40 000 clients).
   Découpés en étapes : 13,85 % contre 4,53 % (Formstack).
   Ordre : ce qui se touche d'abord, ce qui se tape ensuite, ce qui
   coûte le plus en dernier — une fois l'engagement pris.
   ============================================================ */

import { SALLES, JOURS } from "./data.js";
import { track } from "./track.js";
import { thud } from "./audio.js";
import { esc, pic, fr } from "./ui.js";
import { mountImages } from "./reveal.js";

export const state = {
  salle: "", jour: "",
  prenom: "", nom: "", email: "", tel: "", naissance: "", sexe: "",
  ami: null,        // null = pas répondu · false = seul · objet = à deux
  rgpd: false,
  step: 0,
  maxStep: 0,
};

const STEPS = [
  {
    id: "salle", key: "salle", kind: "choix", visuel: true,
    q: "Dans quelle salle veux-tu venir ?",
    why: "Une seule chose à toucher. Tu ne tapes rien pour l'instant.",
    options: () => SALLES.map((s) => ({ v: s.id, b: s.nom, s: s.fait, img: s.img })),
  },
  {
    id: "jour", key: "jour", kind: "choix", wide: true,
    q: "Quel jour comptes-tu passer ?",
    why: "Une indication, pas un créneau à la minute près. Tu choisis le cours sur place avec l'équipe.",
    options: () => JOURS.map((j) => ({ v: j.id, b: j.nom, s: "" })),
  },
  {
    id: "identite", kind: "champs",
    q: "Comment on t'appelle ?",
    fields: [
      { k: "prenom", l: "Prénom", t: "text", ac: "given-name", ph: "Camille" },
      { k: "nom", l: "Nom", t: "text", ac: "family-name", ph: "Durand" },
    ],
  },
  {
    id: "contact", kind: "champs",
    q: "Où on t'envoie la confirmation ?",
    why: "Un email pour la confirmation, un numéro au cas où le planning bouge. On n'appelle pas pour vendre.",
    fields: [
      { k: "email", l: "Email", t: "email", ac: "email", ph: "camille@exemple.fr" },
      { k: "tel", l: "Téléphone mobile", t: "tel", ac: "tel", ph: "06 12 34 56 78" },
    ],
  },
  {
    id: "fiche", kind: "champs",
    q: "Deux dernières lignes pour ta fiche.",
    // Les deux champs les plus coûteux, placés en dernier, avec leur raison affichée.
    why: "Demandés par le club pour <b>créer ta fiche et te couvrir pendant la séance</b>. Rien d'autre n'en est fait.",
    fields: [
      { k: "naissance", l: "Date de naissance", t: "date", ac: "bday" },
      { k: "sexe", l: "Sexe", t: "select", opts: [["F", "Femme"], ["H", "Homme"], ["A", "Ne se prononce pas"]] },
    ],
  },
  {
    id: "ami", kind: "ami",
    q: "Tu viens avec quelqu'un ?",
    why: "Sa séance est offerte aussi. C'est la première raison pour laquelle on ne pousse jamais la porte d'une salle : ne pas vouloir y aller seul.",
  },
];

const AMI_FIELDS = [
  ["a_prenom", "Son prénom", "text", "Alex", "prenom"],
  ["a_nom", "Son nom", "text", "Martin", "nom"],
  ["a_email", "Son email", "email", "alex@exemple.fr", "email"],
  ["a_tel", "Son mobile", "tel", "06 98 76 54 32", "tel"],
  ["a_naissance", "Sa date de naissance", "date", "", "naissance"],
];

const RX_MAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const RX_TEL = /^(?:\+33|0)\s*[1-9](?:[\s.\-]*\d{2}){4}$/;

function invalid(rule, val) {
  const v = String(val ?? "").trim();
  switch (rule) {
    case "prenom":
    case "nom":
      return v.length < 2 ? "Il manque au moins deux lettres ici." : "";
    case "email":
      return !v ? "On a besoin d'un email pour envoyer la confirmation."
        : !RX_MAIL.test(v) ? "Cet email n'a pas l'air valide — vérifie le @ et ce qui suit." : "";
    case "tel":
      return !v ? "Un numéro de mobile, au cas où le planning change."
        : !RX_TEL.test(v) ? "Format attendu : 06 12 34 56 78 ou +33 6 12 34 56 78." : "";
    case "naissance": {
      if (!v) return "Date de naissance requise par le club pour la fiche.";
      const d = new Date(v);
      if (Number.isNaN(+d)) return "Cette date n'est pas lisible.";
      const age = (Date.now() - +d) / 31557600000;
      if (age < 3) return "Vérifie l'année : cette date donne moins de trois ans.";
      if (age > 100) return "Vérifie l'année de naissance.";
      return "";
    }
    case "sexe":
      return v ? "" : "Champ requis par la fiche du club.";
    default:
      return "";
  }
}

/* ---------- rendu ---------- */

function stepBody(st) {
  if (st.kind === "choix") {
    const cur = state[st.key];
    const cls = "opts" + (st.wide ? " opts--days" : "") + (st.visuel ? " opts--visuel" : "");
    return `<div class="${cls}" role="group" aria-label="${esc(st.q)}">${st
      .options()
      .map(
        (o) => `<button type="button" class="opt${o.img ? " opt--img" : ""}" data-pick="${st.key}" data-val="${esc(o.v)}"
          aria-pressed="${cur === o.v}">${
            o.img ? pic(o.img, { sizes: "(min-width:700px) 210px, 44vw" }) : ""
          }<b>${esc(o.b)}</b>${o.s ? `<span>${esc(o.s)}</span>` : ""}</button>`
      )
      .join("")}</div>`;
  }

  if (st.kind === "champs") {
    return `<div class="fields ${st.fields.length > 1 ? "fields--2" : ""}">${st.fields
      .map((f) => {
        const control =
          f.t === "select"
            ? `<select data-k="${f.k}" autocomplete="sex">
                 <option value="">Choisir…</option>
                 ${f.opts.map(([v, l]) => `<option value="${v}"${state[f.k] === v ? " selected" : ""}>${esc(l)}</option>`).join("")}
               </select>`
            : `<input type="${f.t}" data-k="${f.k}" value="${esc(state[f.k])}"
                 ${f.ac ? `autocomplete="${f.ac}"` : ""} ${f.ph ? `placeholder="${esc(f.ph)}"` : ""} />`;
        return `<label class="field" data-f="${f.k}"><span>${esc(f.l)}</span>${control}<em class="field__err" role="alert"></em></label>`;
      })
      .join("")}</div>`;
  }

  const aDeux = state.ami && typeof state.ami === "object";
  return `
    <div class="opts" role="group" aria-label="Venir accompagné">
      <button type="button" class="opt" data-ami="oui" aria-pressed="${aDeux}"><b>Oui, à deux</b><span>Sa séance est offerte</span></button>
      <button type="button" class="opt" data-ami="non" aria-pressed="${state.ami === false}"><b>Non, seul</b><span>Ça marche aussi</span></button>
    </div>
    <div class="fields fields--2" id="ami-fields"${aDeux ? "" : " hidden"}>
      ${AMI_FIELDS.map(
        ([k, l, t, ph]) =>
          `<label class="field" data-f="${k}"><span>${esc(l)}</span><input type="${t}" data-k="${k}" ${ph ? `placeholder="${esc(ph)}"` : ""} value="${esc((state.ami && state.ami[k]) || "")}" /><em class="field__err" role="alert"></em></label>`
      ).join("")}
      <label class="field" data-f="a_sexe"><span>Son sexe</span>
        <select data-k="a_sexe"><option value="">Choisir…</option>
          ${[["F", "Femme"], ["H", "Homme"], ["A", "Ne se prononce pas"]]
            .map(([v, l]) => `<option value="${v}"${state.ami && state.ami.a_sexe === v ? " selected" : ""}>${l}</option>`)
            .join("")}
        </select><em class="field__err" role="alert"></em></label>
      <p class="step__why" style="grid-column:1/-1">Sa salle et son jour reprennent les tiens. Vous pourrez les changer avec l'équipe sur place.</p>
    </div>
    <label class="consent" data-f="rgpd">
      <input type="checkbox" data-k="rgpd"${state.rgpd ? " checked" : ""} />
      <span>J'accepte que Boxing Center utilise ces informations pour ma séance d'essai et me recontacte à ce sujet. Je peux demander leur suppression à tout moment.</span>
      <em class="field__err" role="alert"></em>
    </label>`;
}

export function formHTML() {
  return `
  <div class="form" id="formulaire">
    <div class="form__head">
      <span class="form__count" id="form-count">Étape 1 sur ${STEPS.length}</span>
      <span class="form__pips" id="form-pips" aria-hidden="true">${STEPS.map(() => "<i></i>").join("")}</span>
    </div>
    <form id="form" novalidate>
      ${STEPS.map(
        (st, i) => `
        <section class="step${i === 0 ? " is-on" : ""}" data-step="${i}" aria-labelledby="q-${i}">
          <h3 class="step__q" id="q-${i}">${esc(st.q)}</h3>
          ${st.why ? `<p class="step__why">${fr(st.why)}</p>` : ""}
          ${stepBody(st)}
          <div class="step__nav">
            ${i > 0 ? `<button type="button" class="back" data-back>← Retour</button>` : ""}
            <button type="button" class="btn btn--primary" data-next>
              ${i === STEPS.length - 1 ? "Je valide ma séance" : "Continuer"}
              <span class="btn__arrow" aria-hidden="true"></span>
            </button>
          </div>
        </section>`
      ).join("")}

      <section class="done" data-step="${STEPS.length}" hidden aria-live="polite" aria-label="Confirmation de ta séance">
        <div class="done__media" id="done-media"></div>
        <div class="done__body">
          <p class="eyebrow">C'est enregistré</p>
          <h3 id="done-h"></h3>
          <p id="done-p"></p>
          <dl class="done__recap" id="done-recap"></dl>
          <div class="done__kit">
            <p class="done__kit-t">Ce que tu apportes</p>
            <ul>
              <li>Une tenue de sport</li>
              <li>Une bouteille d'eau</li>
              <li>Rien d'autre — le matériel est prêté</li>
            </ul>
          </div>
          <p class="step__why">${fr("Maquette : aucune donnée n'est envoyée. En production, cette étape crée la fiche Deciplus, écrit « SEANCE D ESSAI GRATUITE WEB » dans « Info compte / paiement » et déclenche l'email de confirmation.")}</p>
        </div>
      </section>
    </form>
  </div>`;
}

/* ---------- comportement ---------- */

export function mountForm(root, onChange) {
  const form = root.querySelector("#form");
  if (!form) return;

  const count = root.querySelector("#form-count");
  const pips = [...root.querySelectorAll("#form-pips i")];
  const screens = [...form.querySelectorAll("[data-step]")];
  let started = false;

  const paint = () => {
    screens.forEach((s) => {
      const i = Number(s.dataset.step);
      if (i === STEPS.length) s.hidden = state.step !== i;
      else s.classList.toggle("is-on", i === state.step);
    });
    pips.forEach((p, i) => {
      p.classList.toggle("is-on", i === state.step);
      p.classList.toggle("is-done", i < state.step);
    });
    count.textContent =
      state.step >= STEPS.length ? "Séance réservée" : `Étape ${state.step + 1} sur ${STEPS.length}`;
    onChange && onChange(state);
  };

  const begin = () => {
    if (started) return;
    started = true;
    track("formulaire_commence"); // §18.1 — mesurable seulement grâce aux étapes
  };

  const showErr = (k, msg) => {
    const f = form.querySelector(`[data-f="${k}"]`);
    if (!f) return;
    f.classList.toggle("is-bad", !!msg);
    const e = f.querySelector(".field__err");
    if (e) e.textContent = msg || "";
  };

  const validate = () => {
    const st = STEPS[state.step];
    if (!st) return true;

    if (st.kind === "choix") {
      if (state[st.key]) return true;
      const g = form.querySelector(`.step[data-step="${state.step}"] .opts`);
      g && g.animate?.(
        [{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }],
        { duration: 240 }
      );
      return false;
    }

    if (st.kind === "champs") {
      let ok = true;
      st.fields.forEach((f) => {
        const msg = invalid(f.k, state[f.k]);
        showErr(f.k, msg);
        if (msg) ok = false;
      });
      return ok;
    }

    // étape binôme + consentement
    let ok = true;
    const rgpdMsg = state.rgpd ? "" : "Coche cette case pour qu'on puisse enregistrer ton inscription.";
    showErr("rgpd", rgpdMsg);
    if (rgpdMsg) ok = false;

    if (state.ami === null) return false;
    if (state.ami === false) return ok;

    AMI_FIELDS.forEach(([k, , , , rule]) => {
      const msg = invalid(rule, state.ami[k]);
      showErr(k, msg);
      if (msg) ok = false;
    });
    const sx = invalid("sexe", state.ami.a_sexe);
    showErr("a_sexe", sx);
    if (sx) ok = false;
    return ok;
  };

  const finish = () => {
    const salle = SALLES.find((s) => s.id === state.salle);
    const jour = JOURS.find((j) => j.id === state.jour);
    const prenom = (state.prenom || "").trim();

    root.querySelector("#done-h").textContent = jour
      ? `À ${jour.nom.toLowerCase()}, ${prenom}.`
      : `À très vite, ${prenom}.`;

    root.querySelector("#done-p").textContent =
      `Ta séance d'essai est enregistrée${salle ? ` à Boxing Center ${salle.nom}` : ""}. ` +
      `Présente-toi à l'accueil en tenue de sport : le matériel est prêté.` +
      (state.ami && state.ami.a_prenom ? ` La séance de ${state.ami.a_prenom} est enregistrée aussi.` : "");

    root.querySelector("#done-recap").innerHTML = [
      ["Salle", esc(salle ? salle.nom : "—")],
      ["Jour prévu", esc(jour ? jour.nom : "—")],
      ["À régler sur place", "<b>0 €</b> — au lieu de 10 €"],
      ["Accompagné", state.ami ? "oui, sa séance est offerte" : "non"],
    ]
      .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
      .join("");

    const media = root.querySelector("#done-media");
    if (media) {
      // Registre permission : on accompagne, on n'affronte pas (voir data.js).
      media.innerHTML = salle ? pic(salle.accueil || salle.img, { sizes: "(min-width:820px) 320px, 100vw" }) : "";
      // Une image injectée après coup n'a pas d'écouteur de chargement :
      // sans ce rappel, elle reste à opacité 0 et le panneau paraît vide.
      mountImages(media);
    }

    track("formulaire_valide", { salle: state.salle, jour: state.jour, ami: !!state.ami });
  };

  form.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      begin();
      state[pick.dataset.pick] = pick.dataset.val;
      pick.parentElement.querySelectorAll(".opt").forEach((b) => b.setAttribute("aria-pressed", String(b === pick)));
      thud();
      onChange && onChange(state);
      // une décision par écran : on avance tout seul
      setTimeout(() => form.querySelector(`.step[data-step="${state.step}"] [data-next]`)?.click(), 200);
      return;
    }

    const ami = e.target.closest("[data-ami]");
    if (ami) {
      begin();
      const oui = ami.dataset.ami === "oui";
      state.ami = oui ? (typeof state.ami === "object" && state.ami) || {} : false;
      ami.parentElement.querySelectorAll(".opt").forEach((b) => b.setAttribute("aria-pressed", String(b === ami)));
      const box = form.querySelector("#ami-fields");
      if (box) box.hidden = !oui;
      if (!oui) AMI_FIELDS.forEach(([k]) => showErr(k, ""));
      thud();
      track(oui ? "ami_ajoute" : "ami_refuse");
      onChange && onChange(state);
      return;
    }

    if (e.target.closest("[data-back]")) {
      state.step = Math.max(0, state.step - 1);
      paint();
      return;
    }

    if (e.target.closest("[data-next]")) {
      begin();
      if (!validate()) {
        track("etape_bloquee", { etape: state.step + 1 });
        return;
      }
      if (state.step === STEPS.length - 1) {
        state.step = STEPS.length;
        paint();
        finish();
        return;
      }
      state.step += 1;
      state.maxStep = Math.max(state.maxStep, state.step);
      track("etape_atteinte", { etape: state.step + 1 });
      paint();
    }
  });

  form.addEventListener("input", (e) => {
    const k = e.target.dataset && e.target.dataset.k;
    if (!k) return;
    begin();
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (k.startsWith("a_")) {
      if (typeof state.ami !== "object" || !state.ami) state.ami = {};
      state.ami[k] = val;
    } else {
      state[k] = val;
    }
    showErr(k, "");
    onChange && onChange(state);
  });

  // Abandon d'étape — la donnée que le §18.1 réclame
  window.addEventListener("pagehide", () => {
    if (started && state.step < STEPS.length) track("etape_abandonnee", { etape: state.step + 1 });
  });

  paint();
}

/** Fait avancer le formulaire si la salle a déjà été choisie plus haut dans la page. */
export function skipKnownSteps(root) {
  if (state.salle && state.step === 0) root.querySelector('.step[data-step="0"] [data-next]')?.click();
  if (state.jour && state.step === 1) root.querySelector('.step[data-step="1"] [data-next]')?.click();
}

export const STEP_COUNT = STEPS.length;
