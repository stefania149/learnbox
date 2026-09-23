CREATE TABLE "exercitiu_personalizat" (
	"exercitiu_id" integer PRIMARY KEY NOT NULL,
	"enunt" text NOT NULL,
	"creat_la" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercitiu_personalizat" ADD CONSTRAINT "exercitiu_personalizat_exercitiu_id_exercitiu_id_fk" FOREIGN KEY ("exercitiu_id") REFERENCES "public"."exercitiu"("id") ON DELETE no action ON UPDATE no action;