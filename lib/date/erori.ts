/**
 * Mesajul de fond al unei erori de bază de date. Drizzle învelește eroarea
 * Postgres și pune cauza reală în `cause`; fără ea rămâi cu textul interogării
 * și cu nimic despre ce a refuzat baza.
 */
export function mesajEroare(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const cauza = e.cause;
  if (cauza instanceof Error && cauza.message) return cauza.message;
  if (typeof cauza === "string" && cauza) return cauza;
  return e.message;
}
