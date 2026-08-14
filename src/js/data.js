/* ============================================================
   CONTENU — page séance d'essai offerte
   Règle : rien d'inventé. Chaque affirmation est tracée au cahier
   des charges, au brand book ou aux standards de build. Ce qui est
   provisoire porte la mention EXEMPLE et une bannière à l'écran.
   Voix : tutoiement dans le texte, « Je … » sur les boutons (C6).
   Lexique : zéro mot anglais, zéro « combat / compétition ».
   ============================================================ */

export const OFFRE = {
  prixHabituel: "10 €",
  prixOffert: "0 €",
  ctaPrimaire: "Je réserve ma séance offerte",
  dockNote: "2 min · sans engagement",
  /* C1 — le réseau garde l'essai à 10 €. Sans cette phrase, le 0 € de
     cette page détruit le tarif des cinq salles. */
  cadrageTitre: "Pourquoi celle-ci est offerte",
  cadrage:
    "La séance d'essai Boxing Center est à 10 € toute l'année, dans les cinq salles. Tu es arrivé ici par un de nos supports : sur ce lien, elle t'est offerte. C'est le seul endroit où elle l'est.",
};

/* §6.3 — les 5 salles. Balma-Gramont est vendue : ne jamais la citer (C3).
   Visuels et faits repris des cartes officielles de boutique.boxingcenter.fr
   (storefront/public/js/home.js) — mêmes images, mêmes formulations validées.
   Aucune adresse : pas de source fiable pour les cinq. À compléter club. */
export const SALLES = [
  { id: "minimes", nom: "Minimes", fait: "Le berceau du club (2016) · 3 rings", img: "salle-minimes" },
  { id: "st-cyprien", nom: "Saint-Cyprien", fait: "1 200 m² · la plus récente (2025)", img: "salle-saint-cyprien" },
  { id: "ramonville", nom: "Ramonville", fait: "Octogone 7 m · 300 m² extérieur", img: "salle-ramonville" },
  { id: "etats-unis", nom: "États-Unis", fait: "Cage MMA · large choix de disciplines", img: "salle-etats-unis" },
  { id: "portet", nom: "Portet", fait: "Boxe, cross training et MMA", img: "salle-portet" },
];

export const JOURS = [
  { id: "lundi", nom: "Lundi", court: "Lun" },
  { id: "mardi", nom: "Mardi", court: "Mar" },
  { id: "mercredi", nom: "Mercredi", court: "Mer" },
  { id: "jeudi", nom: "Jeudi", court: "Jeu" },
  { id: "vendredi", nom: "Vendredi", court: "Ven" },
  { id: "samedi", nom: "Samedi", court: "Sam" },
];

export const HEROS = {
  a: {
    kicker: "Entre deux rounds, quelqu'un s'occupe de toi",
    titre: ["Ton coin", "t'attend."],
    lede:
      "Une séance encadrée, du matériel prêté, aucune expérience demandée. Tu viens voir à quoi ça ressemble — rien d'autre.",
    img: "coin",
  },
  b: {
    kicker: "Tu as scanné. Voici ton laissez-passer.",
    titre: ["Ta séance", "est offerte."],
    lede:
      "Ce titre d'accès vaut une séance d'essai dans la salle de ton choix. Il se complète en deux minutes et t'attend à l'accueil.",
    img: "femme-garde",
  },
  c: {
    kicker: "Ta première fois, minute par minute",
    titre: ["Tu pousses", "la porte."],
    lede:
      "Personne ne se retourne. On te donne des gants, on te montre où poser ton sac. Voilà les quarante-cinq minutes qui suivent.",
    img: "groupe-rang",
  },
};

/* Sous le premier écran, lisible sans défiler — le §6.1 demande le bénéfice immédiat. */
export const HERO_PREUVES = [
  "Débutants acceptés",
  "Matériel prêté",
  "Cours encadré",
  "Sans obligation d'inscription",
];

/* L'annonce entre deux rounds — le speaker du ring. */
export const ANNONCE = [
  "Débutants acceptés",
  "Matériel prêté",
  "Aucune expérience demandée",
  "Cinq salles à Toulouse",
  "Viens à deux, sa séance est offerte aussi",
  "Sans obligation d'inscription",
];

/* §6.2 — la réassurance, écrite dans les mots du prospect.
   Chaque réponse est tracée, aucune promesse ajoutée. */
export const PEURS = [
  {
    q: "Je n'ai jamais mis un gant.",
    r: "Aucune expérience n'est demandée. Les débutants sont acceptés à chaque cours, et ça commence par la garde — pour tout le monde, y compris ceux qui viennent depuis deux ans.",
    src: "cahier §6.2",
  },
  {
    q: "Je vais me retrouver seul.",
    r: "Tu peux venir accompagné, et la séance de la personne qui vient avec toi est offerte aussi.",
    src: "cahier §6.2 + §8",
    lien: { href: "#binome", texte: "Amener quelqu'un" },
  },
  {
    q: "Je n'ai pas de matériel.",
    r: "Le matériel est prêté. Une tenue de sport, une bouteille d'eau, et tu es prêt.",
    src: "standards de build + cahier §11.1",
  },
  {
    q: "Personne ne va s'occuper de moi.",
    r: "Le cours est encadré par un coach du début à la fin. Tu suis, il corrige.",
    src: "cahier §6.2",
  },
  {
    q: "Je vais devoir m'inscrire derrière.",
    r: "La séance est sans obligation d'inscription. Tu repars libre, et ça reste vrai si tu ne reviens jamais.",
    src: "cahier §6.2",
  },
  {
    q: "Ce n'est pas mon niveau.",
    r: "L'ambiance est loisir et accessible. Tu n'as rien à prouver à personne, surtout pas le premier jour.",
    src: "cahier §6.2",
  },
  {
    q: "Je ne sais pas quelle discipline choisir.",
    r: "Tu n'as pas à choisir maintenant. Tu indiques ta salle et ton jour, on t'oriente sur place.",
    src: "cahier §6.4",
  },
  {
    q: "Ce n'est pas près de chez moi.",
    r: "Cinq salles, cinq quartiers. Tu prends celle qui t'arrange, pas celle qu'on te donne.",
    src: "cahier §6.3",
  },
];

/* Direction C — les mêmes peurs, horodatées. Horaires illustratifs, à valider. */
export const CHAPITRES = [
  { t: "19:02", h: "Tu te présentes à l'accueil.", p: "On t'attend : ton nom est sur la liste du jour. Tenue de sport, c'est tout ce qu'on t'a demandé.", q: "Je ne saurai pas où aller.", img: "groupe-rang" },
  { t: "19:06", h: "On te prête les gants.", p: "Le matériel est prêté. Rien à acheter, rien à prévoir, rien à savoir choisir.", q: "Je n'ai pas de matériel.", img: "portrait-gants" },
  { t: "19:12", h: "Le coach ouvre le cours.", p: "Le cours est encadré du début à la fin. Tu n'as qu'à suivre — il corrige au fur et à mesure.", q: "Personne ne va s'occuper de moi.", img: "coach-ring" },
  { t: "19:20", h: "Tout le monde reprend la garde.", p: "Aucune expérience n'est demandée. On repart des bases à chaque cours.", q: "Je n'ai jamais mis un gant.", img: "coin" },
  { t: "19:40", h: "Tu regardes à côté de toi.", p: "Ambiance loisir, accessible. Et si tu es venu à deux, sa séance était offerte aussi.", q: "Je vais me retrouver seul.", img: "cours-groupe" },
  { t: "19:50", h: "Tu repars libre.", p: "Séance sans obligation d'inscription. Si tu reviens, ce sera parce que tu en as envie.", q: "Je vais devoir m'inscrire derrière.", img: "femme-garde" },
];

/* §6.4 — plannings. DONNÉES D'EXEMPLE, bannière visible à l'écran.
   Le prospect ne choisit ni l'heure ni le cours : seulement salle + jour.
   `true` = créneau accessible sans expérience. */
export const PLANNINGS_EXEMPLE = {
  _exemple: true,
  minimes: {
    lundi: [["18:30", "Boxe anglaise", true], ["19:45", "Boxing Fitness", true]],
    mardi: [["12:15", "Crosstraining", false], ["19:00", "Kick-Boxing", true]],
    mercredi: [["18:00", "Lady Boxing", true], ["19:30", "Boxe anglaise", false]],
    jeudi: [["19:00", "Boxe pieds-poings", true]],
    vendredi: [["18:30", "Boxing Fitness", true], ["20:00", "Boxe anglaise", false]],
    samedi: [["10:30", "Boxe anglaise", true]],
  },
  "st-cyprien": {
    lundi: [["19:00", "Boxe anglaise", true]],
    mardi: [["18:30", "Boxing Fitness", true], ["20:00", "Grappling", false]],
    mercredi: [["18:00", "Lady Boxing", true]],
    jeudi: [["19:15", "Kick-Boxing", true], ["20:30", "JJB", false]],
    vendredi: [["18:30", "Boxe anglaise", true]],
    samedi: [["11:00", "Boxing Fitness", true]],
  },
  ramonville: {
    lundi: [["18:45", "Boxe pieds-poings", true]],
    mardi: [["19:00", "Boxe anglaise", true]],
    mercredi: [["18:15", "Boxing Fitness", true], ["19:45", "MMA", false]],
    jeudi: [["19:00", "Lady Boxing", true]],
    vendredi: [["18:30", "Kick-Boxing", true]],
    samedi: [["10:00", "Boxe anglaise", true]],
  },
  "etats-unis": {
    lundi: [["18:30", "Boxe anglaise", true], ["20:00", "MMA", false]],
    mardi: [["19:00", "Boxing Fitness", true]],
    mercredi: [["18:00", "Boxe française", true]],
    jeudi: [["19:30", "Grappling", false]],
    vendredi: [["18:30", "Lady Boxing", true]],
    samedi: [["10:30", "Boxe anglaise", true], ["12:00", "Crosstraining", false]],
  },
  portet: {
    lundi: [["19:00", "Kick-Boxing", true]],
    mardi: [["18:30", "Boxe anglaise", true], ["20:00", "MMA", false]],
    mercredi: [["18:00", "Boxing Fitness", true]],
    jeudi: [["19:15", "Boxe française", true]],
    vendredi: [["18:45", "Grappling", false]],
    samedi: [["10:30", "Boxe anglaise", true]],
  },
};

/* Avis Google réels, verbatim, relevé du 2026-07-12.
   États-Unis n'a aucun avis citable : on n'affiche rien plutôt qu'inventer. */
export const AVIS = {
  salle: "Boxing Center Minimes",
  note: "4,3",
  nombre: 157,
  source: "Avis Google",
  quotes: [
    { t: "Très belle salle de boxe. Matos au top, coach et staff accueillant.", a: "Hamed S." },
    { t: "J'ai adoré mes trois ans passés à faire du sport à Boxing Center. Équipe au top.", a: "Salomé C." },
    { t: "Superbe salle, très bonne ambiance. Je pratique les cours de boxe anglaise loisir.", a: "Pascal L." },
  ],
};

/* §18.2 — les sources à distinguer, lues depuis ?src= */
export const SOURCES = {
  flyer: "QR flyer",
  affiche: "QR affiche",
  porte: "Accroche-porte",
  print: "Support print",
  meta: "Campagne Meta",
  story: "Story Instagram",
  fb: "Publication Facebook",
  wa: "WhatsApp",
};

/* Les rounds : le squelette de la page. */
export const ROUNDS = [
  { id: "cadrage", n: "01", label: "L'offre" },
  { id: "reassurance", n: "02", label: "Tes doutes" },
  { id: "salles", n: "03", label: "Ta salle" },
  { id: "plannings", n: "04", label: "Ton jour" },
  { id: "inscription", n: "05", label: "Ta place" },
];
