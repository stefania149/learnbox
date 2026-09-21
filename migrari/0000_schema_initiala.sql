CREATE TABLE "capitol" (
	"id" serial PRIMARY KEY NOT NULL,
	"materie_id" integer NOT NULL,
	"nume" text NOT NULL,
	"ordine" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercitiu" (
	"id" serial PRIMARY KEY NOT NULL,
	"nivel_id" integer NOT NULL,
	"tip" text NOT NULL,
	"enunt" text NOT NULL,
	"cod_initial" text,
	"solutie" text,
	"cazuri_test" jsonb,
	"rubrica" jsonb,
	"explicatie_predefinita" text
);
--> statement-breakpoint
CREATE TABLE "incercare" (
	"id" serial PRIMARY KEY NOT NULL,
	"exercitiu_id" integer,
	"test_id" integer,
	"raspuns" text,
	"verdict" text,
	"cazuri_trecute" integer,
	"cazuri_total" integer,
	"eroare_python" text,
	"explicatie_eroare" text,
	"xp" integer DEFAULT 0 NOT NULL,
	"creat_la" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materie" (
	"id" serial PRIMARY KEY NOT NULL,
	"nume" text NOT NULL,
	"sursa" text DEFAULT 'livrat' NOT NULL,
	"tema_implicita" text,
	"stare_generare" text DEFAULT 'gata' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nivel" (
	"id" serial PRIMARY KEY NOT NULL,
	"capitol_id" integer NOT NULL,
	"nume" text NOT NULL,
	"ordine" integer NOT NULL,
	"briefing" jsonb,
	"stare" text DEFAULT 'blocat' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progres_nivel" (
	"nivel_id" integer PRIMARY KEY NOT NULL,
	"stare" text DEFAULT 'neinceput' NOT NULL,
	"xp_obtinut" integer DEFAULT 0 NOT NULL,
	"terminat_la" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "setari" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"tema_activa" text DEFAULT 'sobra' NOT NULL,
	"registru_ton" text DEFAULT 'neutru' NOT NULL,
	"materie_activa" integer,
	"model_descarcat" boolean DEFAULT false NOT NULL,
	CONSTRAINT "setari_rand_unic" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "stapanire" (
	"concept_id" integer PRIMARY KEY NOT NULL,
	"stabilitate" integer DEFAULT 0 NOT NULL,
	"dificultate" integer DEFAULT 0 NOT NULL,
	"urmatoarea_verificare" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "test" (
	"id" serial PRIMARY KEY NOT NULL,
	"nivel_id" integer,
	"capitol_id" integer,
	"intrebari" jsonb
);
--> statement-breakpoint
CREATE TABLE "xp_total" (
	"materie_id" integer PRIMARY KEY NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"nivel_jucator" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "capitol" ADD CONSTRAINT "capitol_materie_id_materie_id_fk" FOREIGN KEY ("materie_id") REFERENCES "public"."materie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercitiu" ADD CONSTRAINT "exercitiu_nivel_id_nivel_id_fk" FOREIGN KEY ("nivel_id") REFERENCES "public"."nivel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incercare" ADD CONSTRAINT "incercare_exercitiu_id_exercitiu_id_fk" FOREIGN KEY ("exercitiu_id") REFERENCES "public"."exercitiu"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incercare" ADD CONSTRAINT "incercare_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nivel" ADD CONSTRAINT "nivel_capitol_id_capitol_id_fk" FOREIGN KEY ("capitol_id") REFERENCES "public"."capitol"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progres_nivel" ADD CONSTRAINT "progres_nivel_nivel_id_nivel_id_fk" FOREIGN KEY ("nivel_id") REFERENCES "public"."nivel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setari" ADD CONSTRAINT "setari_materie_activa_materie_id_fk" FOREIGN KEY ("materie_activa") REFERENCES "public"."materie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test" ADD CONSTRAINT "test_nivel_id_nivel_id_fk" FOREIGN KEY ("nivel_id") REFERENCES "public"."nivel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test" ADD CONSTRAINT "test_capitol_id_capitol_id_fk" FOREIGN KEY ("capitol_id") REFERENCES "public"."capitol"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_total" ADD CONSTRAINT "xp_total_materie_id_materie_id_fk" FOREIGN KEY ("materie_id") REFERENCES "public"."materie"("id") ON DELETE no action ON UPDATE no action;