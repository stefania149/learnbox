ALTER TABLE "test" ADD COLUMN "cheie" text;--> statement-breakpoint
ALTER TABLE "test" ADD COLUMN "titlu" text;--> statement-breakpoint
ALTER TABLE "test" ADD CONSTRAINT "test_nivel" UNIQUE("nivel_id");--> statement-breakpoint
ALTER TABLE "test" ADD CONSTRAINT "test_capitol" UNIQUE("capitol_id");