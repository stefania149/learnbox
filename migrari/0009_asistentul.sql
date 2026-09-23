CREATE TABLE "conversatie" (
	"id" serial PRIMARY KEY NOT NULL,
	"rol" text NOT NULL,
	"text" text NOT NULL,
	"creat_la" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memorie" (
	"id" serial PRIMARY KEY NOT NULL,
	"tip" text NOT NULL,
	"continut" text NOT NULL,
	"creat_la" timestamp with time zone DEFAULT now() NOT NULL,
	"sters_la" timestamp with time zone
);
