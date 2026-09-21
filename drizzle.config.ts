import { defineConfig } from "drizzle-kit";

/**
 * Migrările se generează la autor și se comit în repo. Nu există bază de date
 * pe server — dialectul e Postgres fiindcă PGlite e Postgres (`PLAN.md` §4).
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/date/schema.ts",
  out: "./migrari",
  driver: "pglite",
  dbCredentials: { url: "./.date-dev" },
});
