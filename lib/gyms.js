const GYMS = {
  minimes: {
    id: 'minimes',
    nom: 'Minimes',
    label: 'Boxing Center Minimes',
    deciplus_label: 'Minimes',
    address: '12 rue de Fenouillet',
    postal_code: '31200',
    city: 'Toulouse',
  },
  'st-cyprien': {
    id: 'st-cyprien',
    nom: 'Saint-Cyprien',
    label: 'Boxing Center St-Cyprien',
    deciplus_label: 'St-Cyprien',
    address: '11 Rue Sainte-Lucie',
    postal_code: '31300',
    city: 'Toulouse',
  },
  ramonville: {
    id: 'ramonville',
    nom: 'Ramonville',
    label: 'Boxing Center Ramonville',
    deciplus_label: 'Ramonville',
    address: '33 rue des Ormes',
    postal_code: '31530',
    city: 'Ramonville',
  },
  'etats-unis': {
    id: 'etats-unis',
    nom: 'États-Unis',
    label: 'Boxing Center États-Unis',
    deciplus_label: 'Minimes',
    address: '388 avenue des États-Unis',
    postal_code: '31200',
    city: 'Toulouse',
  },
  portet: {
    id: 'portet',
    nom: 'Portet',
    label: 'Boxing Center Portet',
    deciplus_label: 'Portet',
    address: '61 route d\'Espagne',
    postal_code: '31120',
    city: 'Portet-sur-Garonne',
  },
};

export function getGym(id) {
  return GYMS[String(id || '').toLowerCase()] || null;
}

export function listGyms() {
  return Object.values(GYMS);
}

export { GYMS };
