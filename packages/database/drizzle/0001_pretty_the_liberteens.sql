ALTER TABLE "natures" ADD COLUMN "pokeapi_id" integer;--> statement-breakpoint
ALTER TABLE "natures" ADD CONSTRAINT "natures_pokeapi_id_unique" UNIQUE("pokeapi_id");