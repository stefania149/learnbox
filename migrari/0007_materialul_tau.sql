CREATE TABLE "chunk" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer NOT NULL,
	"text" text NOT NULL,
	"pagina" integer NOT NULL,
	"embedding" jsonb
);
--> statement-breakpoint
CREATE TABLE "material" (
	"id" serial PRIMARY KEY NOT NULL,
	"titlu" text NOT NULL,
	"fisier" text NOT NULL,
	"tip" text DEFAULT 'pdf' NOT NULL,
	"importat_la" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE no action ON UPDATE no action;