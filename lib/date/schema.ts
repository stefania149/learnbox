/**
 * Schema de date, după `PLAN.md` §11. Nume în română fără diacritice.
 *
 * Tabelele pentru asistent (`concept`, `concept_leg`, `memorie`,
 * `conversatie`) vin cu migrarea lor mai încolo în faza 3. `material` și
 * `chunk` vin la pasul 18: `embedding` e `jsonb`, nu un tip de vector — PGlite
 * 0.5.8 n-are extensia `pgvector` (`PLAN.md` §15, Î-12, acum decis: 384 de
 * numere, din `Xenova/all-MiniLM-L6-v2`). Cu câte materiale importă un
 * singur utilizator, o comparare în JS peste toate rândurile e destul —
 * pgvector se adaugă dacă vreodată devine încet.
 */
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// —— Cursul ——————————————————————————————————————————————————

export const materie = pgTable("materie", {
  id: serial("id").primaryKey(),
  nume: text("nume").notNull(),
  // 'livrat' — vine cu aplicația; 'generat' — construit din materialul tău.
  sursa: text("sursa").notNull().default("livrat"),
  temaImplicita: text("tema_implicita"),
  stareGenerare: text("stare_generare").notNull().default("gata"),
});

/**
 * `cheie` e numele stabil din fisierul de curs livrat: `nume` si `enunt` se
 * pot rescrie oricand, ea nu, fiindca de ea atarna progresul. Coloana e
 * nullable fiindca o baza dinainte de pasul 11 are randuri fara ea; se
 * completeaza la prima asezare a cursului.
 */
export const capitol = pgTable(
  "capitol",
  {
    id: serial("id").primaryKey(),
    materieId: integer("materie_id")
      .notNull()
      .references(() => materie.id),
    cheie: text("cheie"),
    nume: text("nume").notNull(),
    ordine: integer("ordine").notNull(),
  },
  (t) => [unique("capitol_cheie").on(t.materieId, t.cheie)],
);

export const nivel = pgTable(
  "nivel",
  {
    id: serial("id").primaryKey(),
    capitolId: integer("capitol_id")
      .notNull()
      .references(() => capitol.id),
    cheie: text("cheie"),
    nume: text("nume").notNull(),
    ordine: integer("ordine").notNull(),
    briefing: jsonb("briefing"),
    stare: text("stare").notNull().default("blocat"),
  },
  (t) => [unique("nivel_cheie").on(t.capitolId, t.cheie)],
);

export const exercitiu = pgTable(
  "exercitiu",
  {
    id: serial("id").primaryKey(),
    nivelId: integer("nivel_id")
      .notNull()
      .references(() => nivel.id),
    cheie: text("cheie"),
    // Ordinea in lectie. Pana la pasul 11 se lua din fisierul de continut:
    // `id` creste, deci un exercitiu adaugat tarziu cadea la coada.
    ordine: integer("ordine"),
    // 'completeaza' | 'repara' | 'scrie' | 'liber'
    tip: text("tip").notNull(),
    // 'python' | 'sql'. Pe ce motor se ruleaza. Nul inseamna Python: asa erau
    // toate exercitiile pana la cursul de SQL.
    limbaj: text("limbaj"),
    enunt: text("enunt").notNull(),
    codInitial: text("cod_initial"),
    solutie: text("solutie"),
    cazuriTest: jsonb("cazuri_test"),
    rubrica: jsonb("rubrica"),
    // Explicația greșelilor tipice, scrisă la generare: fără ea, un utilizator
    // fără model n-ar primi niciun răspuns util (`PLAN.md` §11).
    explicatiePredefinita: text("explicatie_predefinita"),
  },
  (t) => [unique("exercitiu_cheie").on(t.nivelId, t.cheie)],
);

/**
 * Testul unei lectii sau al unui capitol (`PLAN.md` §8). Unul singur de
 * fiecare, de-aia `nivel_id` si `capitol_id` sunt unice: in Postgres, NULL nu
 * se bate cu NULL, deci testele de capitol nu se incurca intre ele.
 */
export const test = pgTable(
  "test",
  {
    id: serial("id").primaryKey(),
    nivelId: integer("nivel_id").references(() => nivel.id),
    capitolId: integer("capitol_id").references(() => capitol.id),
    cheie: text("cheie"),
    titlu: text("titlu"),
    intrebari: jsonb("intrebari"),
  },
  (t) => [unique("test_nivel").on(t.nivelId), unique("test_capitol").on(t.capitolId)],
);

// —— Materialul tău (import propriu) —————————————————————————————

/** Un fișier importat de utilizator — pasul 18. */
export const material = pgTable("material", {
  id: serial("id").primaryKey(),
  titlu: text("titlu").notNull(),
  // Numele fișierului ales de utilizator, ca să se recunoască în listă.
  fisier: text("fisier").notNull(),
  // 'pdf' — singurul deocamdată. Text și imagini vin când au import propriu.
  tip: text("tip").notNull().default("pdf"),
  importatLa: timestamp("importat_la", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * O bucată de text dintr-un material, cu locul ei (pagina) și embeddingul ei.
 * `embedding` e un `jsonb` cu 384 de numere (`Xenova/all-MiniLM-L6-v2`) — vezi
 * nota de la începutul fișierului.
 */
export const chunk = pgTable("chunk", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id")
    .notNull()
    .references(() => material.id),
  text: text("text").notNull(),
  pagina: integer("pagina").notNull(),
  embedding: jsonb("embedding"),
});

// —— Progresul ————————————————————————————————————————————————

export const progresNivel = pgTable("progres_nivel", {
  nivelId: integer("nivel_id")
    .primaryKey()
    .references(() => nivel.id),
  stare: text("stare").notNull().default("neinceput"),
  xpObtinut: integer("xp_obtinut").notNull().default(0),
  terminatLa: timestamp("terminat_la", { withTimezone: true }),
  // XP-ul pentru briefing se dă o dată (`PLAN.md` §8), deci trebuie ținut minte
  // separat de starea lecției, care merge mai departe.
  briefingCitit: boolean("briefing_citit").notNull().default(false),
});

/**
 * IMUTABILĂ. Fără UPDATE, fără DELETE — o reluare se scrie ca rând nou.
 * Istoricul greșelilor e ce face Arhiva posibilă (`PLAN.md` §11).
 */
export const incercare = pgTable("incercare", {
  id: serial("id").primaryKey(),
  exercitiuId: integer("exercitiu_id").references(() => exercitiu.id),
  testId: integer("test_id").references(() => test.id),
  raspuns: text("raspuns"),
  verdict: text("verdict"),
  cazuriTrecute: integer("cazuri_trecute"),
  cazuriTotal: integer("cazuri_total"),
  eroarePython: text("eroare_python"),
  explicatieEroare: text("explicatie_eroare"),
  // Întreg, niciodată negativ (regula 4).
  xp: integer("xp").notNull().default(0),
  creatLa: timestamp("creat_la", { withTimezone: true }).notNull().defaultNow(),
});

export const xpTotal = pgTable("xp_total", {
  materieId: integer("materie_id")
    .primaryKey()
    .references(() => materie.id),
  xp: integer("xp").notNull().default(0),
  nivelJucator: integer("nivel_jucator").notNull().default(1),
});

export const stapanire = pgTable("stapanire", {
  // Fără cheie străină încă: `concept` vine în faza 3.
  conceptId: integer("concept_id").primaryKey(),
  stabilitate: integer("stabilitate").notNull().default(0),
  dificultate: integer("dificultate").notNull().default(0),
  urmatoareaVerificare: timestamp("urmatoarea_verificare", {
    withTimezone: true,
  }),
});

/**
 * Ce pachet de conținut livrat a intrat deja în baza asta. Funcționează ca
 * migrările: un pachet se aplică o dată și nu se rescrie, fiindcă `incercare`
 * trimite la exercițiile lui.
 */
export const samantaAplicata = pgTable("samanta_aplicata", {
  nume: text("nume").primaryKey(),
  aplicataLa: timestamp("aplicata_la", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// —— Utilizatorul ——————————————————————————————————————————————

/** Un singur rând, `id = 1`. */
export const setari = pgTable(
  "setari",
  {
    id: integer("id").primaryKey().default(1),
    temaActiva: text("tema_activa").notNull().default("sobra"),
    // 'jucaus' | 'neutru' | 'sec' (`PLAN.md` §8)
    registruTon: text("registru_ton").notNull().default("neutru"),
    materieActiva: integer("materie_activa").references(() => materie.id),
    modelDescarcat: boolean("model_descarcat").notNull().default(false),
    // Numele de pe ecranul de profil. E al tău și stă pe calculatorul tău:
    // nu e cont, nu pleacă nicăieri, și poate lipsi.
    numeAfisat: text("nume_afisat"),
    // Pentru bonusul de revenire (`PLAN.md` §8), care se dă tăcut.
    vazutUltimaData: timestamp("vazut_ultima_data", { withTimezone: true }),
  },
  (t) => [unique("setari_rand_unic").on(t.id)],
);
