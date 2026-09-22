/**
 * Schema de date, după `PLAN.md` §11. Nume în română fără diacritice.
 *
 * Tabelele pentru import propriu și pentru asistent (`material`, `chunk`,
 * `concept`, `concept_leg`, `memorie`, `conversatie`) vin cu migrarea lor în
 * faza 3: `chunk.embedding` cere o dimensiune de vector pe care n-am ales-o
 * încă (vezi `PLAN.md` §15, Î-12).
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

export const test = pgTable("test", {
  id: serial("id").primaryKey(),
  nivelId: integer("nivel_id").references(() => nivel.id),
  capitolId: integer("capitol_id").references(() => capitol.id),
  intrebari: jsonb("intrebari"),
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
