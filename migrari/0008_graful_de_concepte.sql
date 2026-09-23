CREATE TABLE "concept" (
	"id" serial PRIMARY KEY NOT NULL,
	"materie_id" integer NOT NULL,
	"nume" text NOT NULL,
	"descriere" text,
	"provenienta" text DEFAULT 'material' NOT NULL,
	"chunk_id" integer
);
--> statement-breakpoint
CREATE TABLE "concept_leg" (
	"concept_id" integer NOT NULL,
	"depinde_de_id" integer NOT NULL,
	CONSTRAINT "concept_leg_unica" UNIQUE("concept_id","depinde_de_id")
);
--> statement-breakpoint
ALTER TABLE "concept" ADD CONSTRAINT "concept_materie_id_materie_id_fk" FOREIGN KEY ("materie_id") REFERENCES "public"."materie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept" ADD CONSTRAINT "concept_chunk_id_chunk_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunk"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_leg" ADD CONSTRAINT "concept_leg_concept_id_concept_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concept"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_leg" ADD CONSTRAINT "concept_leg_depinde_de_id_concept_id_fk" FOREIGN KEY ("depinde_de_id") REFERENCES "public"."concept"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stapanire" ADD CONSTRAINT "stapanire_concept_id_concept_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concept"("id") ON DELETE no action ON UPDATE no action;