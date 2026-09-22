ALTER TABLE "capitol" ADD COLUMN "cheie" text;--> statement-breakpoint
ALTER TABLE "exercitiu" ADD COLUMN "cheie" text;--> statement-breakpoint
ALTER TABLE "exercitiu" ADD COLUMN "ordine" integer;--> statement-breakpoint
ALTER TABLE "nivel" ADD COLUMN "cheie" text;--> statement-breakpoint
ALTER TABLE "capitol" ADD CONSTRAINT "capitol_cheie" UNIQUE("materie_id","cheie");--> statement-breakpoint
ALTER TABLE "exercitiu" ADD CONSTRAINT "exercitiu_cheie" UNIQUE("nivel_id","cheie");--> statement-breakpoint
ALTER TABLE "nivel" ADD CONSTRAINT "nivel_cheie" UNIQUE("capitol_id","cheie");