/** Ce e în baza locală — pentru ecranul de stare. */
import { deschideBaza, migrariAplicate } from "./client";

export type DiagnosticDate = {
  migrari: { nume: string; aplicataLa: Date }[];
  tabele: { nume: string; randuri: number }[];
};

export async function citesteDiagnostic(): Promise<DiagnosticDate> {
  const { pg } = await deschideBaza();

  const aplicate = await migrariAplicate(pg);

  const tabele = await pg.query<{ table_name: string }>(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
     order by table_name`,
  );

  const cuRanduri = await Promise.all(
    tabele.rows.map(async ({ table_name }) => {
      // Numele vin din information_schema, nu de la utilizator; le punem
      // totuși în ghilimele, ca o identificare greșită să nu treacă.
      const r = await pg.query<{ n: number }>(
        `select count(*)::int as n from "${table_name.replace(/"/g, '""')}"`,
      );
      return { nume: table_name, randuri: r.rows[0]?.n ?? 0 };
    }),
  );

  return {
    migrari: aplicate.map((m) => ({ nume: m.nume, aplicataLa: m.aplicata_la })),
    tabele: cuRanduri,
  };
}
