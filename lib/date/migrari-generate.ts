// GENERAT de scripts/impacheteaza-migrari.mjs — nu se editează de mână.
// Sursa sunt fișierele din migrari/, care rămân adevărul.

export type Migrare = { nume: string; sql: string };

export const migrari: Migrare[] = [
  {
    nume: "0000_schema_initiala.sql",
    sql: "CREATE TABLE \"capitol\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"materie_id\" integer NOT NULL,\n\t\"nume\" text NOT NULL,\n\t\"ordine\" integer NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE \"exercitiu\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"nivel_id\" integer NOT NULL,\n\t\"tip\" text NOT NULL,\n\t\"enunt\" text NOT NULL,\n\t\"cod_initial\" text,\n\t\"solutie\" text,\n\t\"cazuri_test\" jsonb,\n\t\"rubrica\" jsonb,\n\t\"explicatie_predefinita\" text\n);\n--> statement-breakpoint\nCREATE TABLE \"incercare\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"exercitiu_id\" integer,\n\t\"test_id\" integer,\n\t\"raspuns\" text,\n\t\"verdict\" text,\n\t\"cazuri_trecute\" integer,\n\t\"cazuri_total\" integer,\n\t\"eroare_python\" text,\n\t\"explicatie_eroare\" text,\n\t\"xp\" integer DEFAULT 0 NOT NULL,\n\t\"creat_la\" timestamp with time zone DEFAULT now() NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE \"materie\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"nume\" text NOT NULL,\n\t\"sursa\" text DEFAULT 'livrat' NOT NULL,\n\t\"tema_implicita\" text,\n\t\"stare_generare\" text DEFAULT 'gata' NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE \"nivel\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"capitol_id\" integer NOT NULL,\n\t\"nume\" text NOT NULL,\n\t\"ordine\" integer NOT NULL,\n\t\"briefing\" jsonb,\n\t\"stare\" text DEFAULT 'blocat' NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE \"progres_nivel\" (\n\t\"nivel_id\" integer PRIMARY KEY NOT NULL,\n\t\"stare\" text DEFAULT 'neinceput' NOT NULL,\n\t\"xp_obtinut\" integer DEFAULT 0 NOT NULL,\n\t\"terminat_la\" timestamp with time zone\n);\n--> statement-breakpoint\nCREATE TABLE \"setari\" (\n\t\"id\" integer PRIMARY KEY DEFAULT 1 NOT NULL,\n\t\"tema_activa\" text DEFAULT 'sobra' NOT NULL,\n\t\"registru_ton\" text DEFAULT 'neutru' NOT NULL,\n\t\"materie_activa\" integer,\n\t\"model_descarcat\" boolean DEFAULT false NOT NULL,\n\tCONSTRAINT \"setari_rand_unic\" UNIQUE(\"id\")\n);\n--> statement-breakpoint\nCREATE TABLE \"stapanire\" (\n\t\"concept_id\" integer PRIMARY KEY NOT NULL,\n\t\"stabilitate\" integer DEFAULT 0 NOT NULL,\n\t\"dificultate\" integer DEFAULT 0 NOT NULL,\n\t\"urmatoarea_verificare\" timestamp with time zone\n);\n--> statement-breakpoint\nCREATE TABLE \"test\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"nivel_id\" integer,\n\t\"capitol_id\" integer,\n\t\"intrebari\" jsonb\n);\n--> statement-breakpoint\nCREATE TABLE \"xp_total\" (\n\t\"materie_id\" integer PRIMARY KEY NOT NULL,\n\t\"xp\" integer DEFAULT 0 NOT NULL,\n\t\"nivel_jucator\" integer DEFAULT 1 NOT NULL\n);\n--> statement-breakpoint\nALTER TABLE \"capitol\" ADD CONSTRAINT \"capitol_materie_id_materie_id_fk\" FOREIGN KEY (\"materie_id\") REFERENCES \"public\".\"materie\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"exercitiu\" ADD CONSTRAINT \"exercitiu_nivel_id_nivel_id_fk\" FOREIGN KEY (\"nivel_id\") REFERENCES \"public\".\"nivel\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"incercare\" ADD CONSTRAINT \"incercare_exercitiu_id_exercitiu_id_fk\" FOREIGN KEY (\"exercitiu_id\") REFERENCES \"public\".\"exercitiu\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"incercare\" ADD CONSTRAINT \"incercare_test_id_test_id_fk\" FOREIGN KEY (\"test_id\") REFERENCES \"public\".\"test\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"nivel\" ADD CONSTRAINT \"nivel_capitol_id_capitol_id_fk\" FOREIGN KEY (\"capitol_id\") REFERENCES \"public\".\"capitol\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"progres_nivel\" ADD CONSTRAINT \"progres_nivel_nivel_id_nivel_id_fk\" FOREIGN KEY (\"nivel_id\") REFERENCES \"public\".\"nivel\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"setari\" ADD CONSTRAINT \"setari_materie_activa_materie_id_fk\" FOREIGN KEY (\"materie_activa\") REFERENCES \"public\".\"materie\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"test\" ADD CONSTRAINT \"test_nivel_id_nivel_id_fk\" FOREIGN KEY (\"nivel_id\") REFERENCES \"public\".\"nivel\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"test\" ADD CONSTRAINT \"test_capitol_id_capitol_id_fk\" FOREIGN KEY (\"capitol_id\") REFERENCES \"public\".\"capitol\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"xp_total\" ADD CONSTRAINT \"xp_total_materie_id_materie_id_fk\" FOREIGN KEY (\"materie_id\") REFERENCES \"public\".\"materie\"(\"id\") ON DELETE no action ON UPDATE no action;",
  },
  {
    nume: "0001_samanta_aplicata.sql",
    sql: "CREATE TABLE \"samanta_aplicata\" (\n\t\"nume\" text PRIMARY KEY NOT NULL,\n\t\"aplicata_la\" timestamp with time zone DEFAULT now() NOT NULL\n);\n",
  },
  {
    nume: "0002_xp_pentru_briefing.sql",
    sql: "ALTER TABLE \"progres_nivel\" ADD COLUMN \"briefing_citit\" boolean DEFAULT false NOT NULL;--> statement-breakpoint\nALTER TABLE \"setari\" ADD COLUMN \"vazut_ultima_data\" timestamp with time zone;",
  },
  {
    nume: "0003_nume_afisat.sql",
    sql: "ALTER TABLE \"setari\" ADD COLUMN \"nume_afisat\" text;",
  },
  {
    nume: "0004_chei_stabile.sql",
    sql: "ALTER TABLE \"capitol\" ADD COLUMN \"cheie\" text;--> statement-breakpoint\nALTER TABLE \"exercitiu\" ADD COLUMN \"cheie\" text;--> statement-breakpoint\nALTER TABLE \"exercitiu\" ADD COLUMN \"ordine\" integer;--> statement-breakpoint\nALTER TABLE \"nivel\" ADD COLUMN \"cheie\" text;--> statement-breakpoint\nALTER TABLE \"capitol\" ADD CONSTRAINT \"capitol_cheie\" UNIQUE(\"materie_id\",\"cheie\");--> statement-breakpoint\nALTER TABLE \"exercitiu\" ADD CONSTRAINT \"exercitiu_cheie\" UNIQUE(\"nivel_id\",\"cheie\");--> statement-breakpoint\nALTER TABLE \"nivel\" ADD CONSTRAINT \"nivel_cheie\" UNIQUE(\"capitol_id\",\"cheie\");",
  },
  {
    nume: "0005_limbajul_exercitiului.sql",
    sql: "ALTER TABLE \"exercitiu\" ADD COLUMN \"limbaj\" text;",
  },
  {
    nume: "0006_testele.sql",
    sql: "ALTER TABLE \"test\" ADD COLUMN \"cheie\" text;--> statement-breakpoint\nALTER TABLE \"test\" ADD COLUMN \"titlu\" text;--> statement-breakpoint\nALTER TABLE \"test\" ADD CONSTRAINT \"test_nivel\" UNIQUE(\"nivel_id\");--> statement-breakpoint\nALTER TABLE \"test\" ADD CONSTRAINT \"test_capitol\" UNIQUE(\"capitol_id\");",
  },
  {
    nume: "0007_materialul_tau.sql",
    sql: "CREATE TABLE \"chunk\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"material_id\" integer NOT NULL,\n\t\"text\" text NOT NULL,\n\t\"pagina\" integer NOT NULL,\n\t\"embedding\" jsonb\n);\n--> statement-breakpoint\nCREATE TABLE \"material\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"titlu\" text NOT NULL,\n\t\"fisier\" text NOT NULL,\n\t\"tip\" text DEFAULT 'pdf' NOT NULL,\n\t\"importat_la\" timestamp with time zone DEFAULT now() NOT NULL\n);\n--> statement-breakpoint\nALTER TABLE \"chunk\" ADD CONSTRAINT \"chunk_material_id_material_id_fk\" FOREIGN KEY (\"material_id\") REFERENCES \"public\".\"material\"(\"id\") ON DELETE no action ON UPDATE no action;",
  },
  {
    nume: "0008_graful_de_concepte.sql",
    sql: "CREATE TABLE \"concept\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"materie_id\" integer NOT NULL,\n\t\"nume\" text NOT NULL,\n\t\"descriere\" text,\n\t\"provenienta\" text DEFAULT 'material' NOT NULL,\n\t\"chunk_id\" integer\n);\n--> statement-breakpoint\nCREATE TABLE \"concept_leg\" (\n\t\"concept_id\" integer NOT NULL,\n\t\"depinde_de_id\" integer NOT NULL,\n\tCONSTRAINT \"concept_leg_unica\" UNIQUE(\"concept_id\",\"depinde_de_id\")\n);\n--> statement-breakpoint\nALTER TABLE \"concept\" ADD CONSTRAINT \"concept_materie_id_materie_id_fk\" FOREIGN KEY (\"materie_id\") REFERENCES \"public\".\"materie\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"concept\" ADD CONSTRAINT \"concept_chunk_id_chunk_id_fk\" FOREIGN KEY (\"chunk_id\") REFERENCES \"public\".\"chunk\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"concept_leg\" ADD CONSTRAINT \"concept_leg_concept_id_concept_id_fk\" FOREIGN KEY (\"concept_id\") REFERENCES \"public\".\"concept\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"concept_leg\" ADD CONSTRAINT \"concept_leg_depinde_de_id_concept_id_fk\" FOREIGN KEY (\"depinde_de_id\") REFERENCES \"public\".\"concept\"(\"id\") ON DELETE no action ON UPDATE no action;--> statement-breakpoint\nALTER TABLE \"stapanire\" ADD CONSTRAINT \"stapanire_concept_id_concept_id_fk\" FOREIGN KEY (\"concept_id\") REFERENCES \"public\".\"concept\"(\"id\") ON DELETE no action ON UPDATE no action;",
  },
  {
    nume: "0009_asistentul.sql",
    sql: "CREATE TABLE \"conversatie\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"rol\" text NOT NULL,\n\t\"text\" text NOT NULL,\n\t\"creat_la\" timestamp with time zone DEFAULT now() NOT NULL\n);\n--> statement-breakpoint\nCREATE TABLE \"memorie\" (\n\t\"id\" serial PRIMARY KEY NOT NULL,\n\t\"tip\" text NOT NULL,\n\t\"continut\" text NOT NULL,\n\t\"creat_la\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\"sters_la\" timestamp with time zone\n);\n",
  },
  {
    nume: "0010_personalizarea.sql",
    sql: "CREATE TABLE \"exercitiu_personalizat\" (\n\t\"exercitiu_id\" integer PRIMARY KEY NOT NULL,\n\t\"enunt\" text NOT NULL,\n\t\"creat_la\" timestamp with time zone DEFAULT now() NOT NULL\n);\n--> statement-breakpoint\nALTER TABLE \"exercitiu_personalizat\" ADD CONSTRAINT \"exercitiu_personalizat_exercitiu_id_exercitiu_id_fk\" FOREIGN KEY (\"exercitiu_id\") REFERENCES \"public\".\"exercitiu\"(\"id\") ON DELETE no action ON UPDATE no action;",
  },
  {
    nume: "0011_tema_automata.sql",
    sql: "ALTER TABLE \"setari\" ALTER COLUMN \"tema_activa\" SET DEFAULT 'auto';",
  },
];
