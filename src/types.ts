/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BetaalCyclus = 'wekelijks' | 'maandelijks' | 'kwartaal' | 'jaarlijks';
export type AbonnementStatus = 'actief' | 'gepauzeerd';

export interface Abonnement {
  id: string;
  naam: string;
  bedrag: number;
  valuta: string;
  categorie: string; // Dynamische, door de gebruiker te bepalen categorieën
  cyclus: BetaalCyclus;
  volgendeBetaling: string; // YYYY-MM-DD
  status: AbonnementStatus;
  betaalmethode: string; // Bijv: 'Creditcard', 'Automatische incasso', 'PayPal', 'iDEAL', 'Overboeking'
  logo?: string;
  emoji?: string;
  beschrijving?: string;
  aangemaaktOp: string;
}

export interface MaandInkomst {
  id: string;
  naam: string;
  bedrag: number;
  valuta: string;
  datum: string; // YYYY-MM-DD
}

export interface BetaalInfo {
  betaaldDoor: 'Thomas' | 'Sanne' | 'Gezamenlijk';
}

export interface EenmaligeUitgave {
  id: string;
  beschrijving: string;
  bedrag: number;
  datum: string; // YYYY-MM-DD
  betaaldDoor: 'Thomas' | 'Sanne' | 'Gezamenlijk';
}

export interface MaandBalansData {
  eenmaligeUitgaven: EenmaligeUitgave[];
  isAfgerekend?: boolean;
}

export interface Notitie {
  id: string;
  titel: string;
  inhoud: string;
  aangemaaktOp: string;
  kleur?: string; // Optionele kleurcode voor notitiekaarten
}

