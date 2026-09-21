CREATE TABLE "samanta_aplicata" (
	"nume" text PRIMARY KEY NOT NULL,
	"aplicata_la" timestamp with time zone DEFAULT now() NOT NULL
);
