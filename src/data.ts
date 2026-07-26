/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Abonnement } from './types';

export const INITIAL_ABONNEMENTEN: Abonnement[] = [
  {
    id: 'ab_1',
    naam: 'Zorgverzekering CZ',
    bedrag: 147.50,
    valuta: 'EUR',
    categorie: 'Verzekeringen',
    cyclus: 'maandelijks',
    volgendeBetaling: '2026-08-01',
    status: 'actief',
    betaalmethode: 'Automatische incasso',
    logo: '🏥',
    beschrijving: 'Basisverzekering + aanvullend tand',
    aangemaaktOp: '2026-01-01T10:00:00Z'
  },
  {
    id: 'ab_2',
    naam: 'Hypotheek Rabobank',
    bedrag: 850.00,
    valuta: 'EUR',
    categorie: 'Hypotheek & Huur',
    cyclus: 'maandelijks',
    volgendeBetaling: '2026-08-01',
    status: 'actief',
    betaalmethode: 'Automatische incasso',
    logo: '🏡',
    beschrijving: 'Maandelijkse hypotheekaflossing & rente',
    aangemaaktOp: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ab_3',
    naam: 'Vattenfall Stroom & Gas',
    bedrag: 120.00,
    valuta: 'EUR',
    categorie: 'Energie & Nutsvoorzieningen',
    cyclus: 'maandelijks',
    volgendeBetaling: '2026-07-28',
    status: 'actief',
    betaalmethode: 'Automatische incasso',
    logo: '⚡',
    beschrijving: 'Variabel energiecontract',
    aangemaaktOp: '2026-02-15T12:00:00Z'
  },
  {
    id: 'ab_4',
    naam: 'Autoverzekering Allianz',
    bedrag: 45.20,
    valuta: 'EUR',
    categorie: 'Verzekeringen',
    cyclus: 'maandelijks',
    volgendeBetaling: '2026-07-25',
    status: 'actief',
    betaalmethode: 'Automatische incasso',
    logo: '🚗',
    beschrijving: 'WA+ Beperkt Casco autoverzekering',
    aangemaaktOp: '2026-03-10T09:30:00Z'
  },
  {
    id: 'ab_5',
    naam: 'Netflix Premium',
    bedrag: 18.99,
    valuta: 'EUR',
    categorie: 'Streaming & Media',
    cyclus: 'maandelijks',
    volgendeBetaling: '2026-07-20',
    status: 'actief',
    betaalmethode: 'Automatische incasso',
    logo: '🍿',
    beschrijving: '4K Ultra HD streaming voor het hele gezin',
    aangemaaktOp: '2026-01-20T21:30:00Z'
  },
  {
    id: 'ab_6',
    naam: 'Spotify Premium',
    bedrag: 10.99,
    valuta: 'EUR',
    categorie: 'Streaming & Media',
    cyclus: 'maandelijks',
    volgendeBetaling: '2026-07-22',
    status: 'actief',
    betaalmethode: 'PayPal',
    logo: '🎵',
    beschrijving: 'Individueel muziekabonnement',
    aangemaaktOp: '2026-01-22T19:45:00Z'
  }
];
