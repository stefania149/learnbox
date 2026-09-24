/**
 * Replicile mascotei la zero XP (pasul 26, `PLAN.md` §8: „a intrat, n-a atins
 * nimic, a ieșit"). Listă fixă, scrisă de mână — regula 2: mascota e date,
 * zero apeluri de model, nu ține minte nimic.
 */

export const REPLICI_ZERO_JUCAUS: readonly string[] = [
  "Hopa! Ecranul ăsta a rămas gol.",
  "Ai trecut pe-aici în vizită, nu la treabă.",
  "Nici eu n-am ce număra acum.",
  "Pssst — exercițiul nu se rezolvă de la distanță.",
];

export const REPLICA_ZERO_NEUTRU =
  "N-ai încercat niciun exercițiu în vizita asta.";

export function replicaZeroAleatoare(): string {
  const i = Math.floor(Math.random() * REPLICI_ZERO_JUCAUS.length);
  return REPLICI_ZERO_JUCAUS[i];
}
