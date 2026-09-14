/**
 * Valeurs du sélecteur de période, dans un module neutre.
 *
 * Elles étaient exportées depuis `PeriodPicker`, marqué `'use client'` : une
 * page serveur qui les importait recevait une référence client et non la
 * chaîne, si bien que la comparaison échouait silencieusement.
 */

/** Le récap porte sur la semaine en cours. */
export const WEEK_PERIOD = 'semaine'

/** Vue transversale : une ligne par saison, avec son champion. */
export const ALL_SEASONS_PERIOD = 'saisons'
