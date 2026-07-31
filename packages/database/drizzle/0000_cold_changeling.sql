CREATE TYPE "public"."auth_token_type" AS ENUM('email-verification', 'password-reset');--> statement-breakpoint
CREATE TYPE "public"."battle_stat" AS ENUM('hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed');--> statement-breakpoint
CREATE TYPE "public"."damage_class" AS ENUM('physical', 'special', 'status');--> statement-breakpoint
CREATE TYPE "public"."form_type" AS ENUM('standard', 'regional', 'mega', 'gigantamax', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'genderless');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('living-dex', 'custom');--> statement-breakpoint
CREATE TYPE "public"."history_action" AS ENUM('create', 'update', 'delete', 'move', 'import', 'export');--> statement-breakpoint
CREATE TYPE "public"."home_plan" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TYPE "public"."import_source" AS ENUM('pokeapi', 'pokesprite', 'showdown', 'seed');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."pokemon_language" AS ENUM('ja', 'en', 'fr', 'it', 'de', 'es', 'ko', 'zh-hans', 'zh-hant');--> statement-breakpoint
CREATE TYPE "public"."pokemon_location" AS ENUM('home', 'scarlet', 'violet', 'sword', 'shield', 'legends-arceus', 'brilliant-diamond', 'shining-pearl', 'lets-go-pikachu', 'lets-go-eevee', 'pokemon-go', 'pokemon-bank', 'other');--> statement-breakpoint
CREATE TYPE "public"."regional_form" AS ENUM('alolan', 'galarian', 'hisuian', 'paldean');--> statement-breakpoint
CREATE TABLE "abilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"pokeapi_id" integer,
	"name" varchar(100) NOT NULL,
	"generation_id" integer,
	"introduced_game_id" integer,
	"introduced_version" varchar(50),
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "abilities_pokeapi_id_unique" UNIQUE("pokeapi_id"),
	CONSTRAINT "abilities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "balls" (
	"id" serial PRIMARY KEY NOT NULL,
	"pokeapi_id" integer,
	"name" varchar(100) NOT NULL,
	"generation_id" integer,
	"introduced_game_id" integer,
	"introduced_version" varchar(50),
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "balls_pokeapi_id_unique" UNIQUE("pokeapi_id"),
	CONSTRAINT "balls_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"species_id" integer NOT NULL,
	"pokeapi_id" integer,
	"name" varchar(100) NOT NULL,
	"form_type" "form_type" DEFAULT 'standard' NOT NULL,
	"regional_form" "regional_form",
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"generation_id" integer,
	"introduced_game_id" integer,
	"introduced_version" varchar(50),
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forms_pokeapi_id_unique" UNIQUE("pokeapi_id"),
	CONSTRAINT "forms_species_name_unique" UNIQUE("species_id","name")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"generation_id" integer,
	CONSTRAINT "games_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" smallint NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "generations_number_unique" UNIQUE("number"),
	CONSTRAINT "generations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"pokeapi_id" integer,
	"name" varchar(100) NOT NULL,
	"category" varchar(100),
	"generation_id" integer,
	"introduced_game_id" integer,
	"introduced_version" varchar(50),
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_pokeapi_id_unique" UNIQUE("pokeapi_id"),
	CONSTRAINT "items_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "moves" (
	"id" serial PRIMARY KEY NOT NULL,
	"pokeapi_id" integer,
	"name" varchar(100) NOT NULL,
	"type_id" integer,
	"damage_class" "damage_class",
	"power" smallint,
	"pp" smallint,
	"accuracy" smallint,
	"generation_id" integer,
	"introduced_game_id" integer,
	"introduced_version" varchar(50),
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moves_pokeapi_id_unique" UNIQUE("pokeapi_id"),
	CONSTRAINT "moves_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "natures" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"increased_stat" "battle_stat",
	"decreased_stat" "battle_stat",
	"generation_id" integer,
	"introduced_game_id" integer,
	"introduced_version" varchar(50),
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "natures_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "regions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "species" (
	"id" serial PRIMARY KEY NOT NULL,
	"pokeapi_id" integer,
	"national_dex_number" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_legendary" boolean DEFAULT false NOT NULL,
	"is_mythical" boolean DEFAULT false NOT NULL,
	"generation_id" integer,
	"introduced_game_id" integer,
	"introduced_version" varchar(50),
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "species_pokeapi_id_unique" UNIQUE("pokeapi_id"),
	CONSTRAINT "species_national_dex_number_unique" UNIQUE("national_dex_number"),
	CONSTRAINT "species_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "types" (
	"id" serial PRIMARY KEY NOT NULL,
	"pokeapi_id" integer,
	"name" varchar(50) NOT NULL,
	"generation_id" integer,
	"introduced_game_id" integer,
	"introduced_version" varchar(50),
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "types_pokeapi_id_unique" UNIQUE("pokeapi_id"),
	CONSTRAINT "types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "auth_token_type" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"user_agent" text,
	"ip" varchar(45),
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"home_plan" "home_plan" DEFAULT 'free' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "original_trainers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"trainer_id" integer NOT NULL,
	"secret_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "original_trainers_user_game_name_tid_unique" UNIQUE("user_id","game_id","name","trainer_id")
);
--> statement-breakpoint
CREATE TABLE "boxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "boxes_user_position_unique" UNIQUE("user_id","position")
);
--> statement-breakpoint
CREATE TABLE "pokemon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"species_id" integer NOT NULL,
	"form_id" integer,
	"gender" "gender" DEFAULT 'genderless' NOT NULL,
	"is_shiny" boolean DEFAULT false NOT NULL,
	"is_alpha" boolean DEFAULT false NOT NULL,
	"is_gigantamax" boolean DEFAULT false NOT NULL,
	"dynamax_level" smallint DEFAULT 0 NOT NULL,
	"tera_type_id" integer,
	"nickname" varchar(100),
	"language" "pokemon_language",
	"level" smallint DEFAULT 1 NOT NULL,
	"original_trainer_id" uuid,
	"ot_name" varchar(100),
	"trainer_id" integer,
	"secret_id" integer,
	"origin_game_id" integer,
	"location" "pokemon_location" DEFAULT 'home' NOT NULL,
	"home_plan" "home_plan",
	"box_id" uuid,
	"slot" smallint,
	"met_level" smallint,
	"met_location" varchar(150),
	"met_date" date,
	"ball_id" integer,
	"is_fateful_encounter" boolean DEFAULT false NOT NULL,
	"nature_id" integer,
	"ability_id" integer,
	"is_hidden_ability" boolean DEFAULT false NOT NULL,
	"held_item_id" integer,
	"ev_hp" smallint,
	"ev_attack" smallint,
	"ev_defense" smallint,
	"ev_special_attack" smallint,
	"ev_special_defense" smallint,
	"ev_speed" smallint,
	"iv_hp" smallint,
	"iv_attack" smallint,
	"iv_defense" smallint,
	"iv_special_attack" smallint,
	"iv_special_defense" smallint,
	"iv_speed" smallint,
	"hyper_trained_hp" boolean DEFAULT false NOT NULL,
	"hyper_trained_attack" boolean DEFAULT false NOT NULL,
	"hyper_trained_defense" boolean DEFAULT false NOT NULL,
	"hyper_trained_special_attack" boolean DEFAULT false NOT NULL,
	"hyper_trained_special_defense" boolean DEFAULT false NOT NULL,
	"hyper_trained_speed" boolean DEFAULT false NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_for_trade" boolean DEFAULT false NOT NULL,
	"is_loaned" boolean DEFAULT false NOT NULL,
	"is_competitive" boolean DEFAULT false NOT NULL,
	"is_ribbon_master" boolean DEFAULT false NOT NULL,
	"notes" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"labels" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pokemon_level_range" CHECK ("pokemon"."level" BETWEEN 1 AND 100),
	CONSTRAINT "pokemon_dynamax_level_range" CHECK ("pokemon"."dynamax_level" BETWEEN 0 AND 10),
	CONSTRAINT "pokemon_slot_range" CHECK ("pokemon"."slot" IS NULL OR "pokemon"."slot" BETWEEN 1 AND 30),
	CONSTRAINT "pokemon_box_slot_pair" CHECK (("pokemon"."box_id" IS NULL) = ("pokemon"."slot" IS NULL)),
	CONSTRAINT "pokemon_no_held_item_in_home" CHECK ("pokemon"."location" <> 'home' OR "pokemon"."held_item_id" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "pokemon_moves" (
	"pokemon_id" uuid NOT NULL,
	"move_id" integer NOT NULL,
	"slot" smallint NOT NULL,
	"pp_ups" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "pokemon_moves_pokemon_id_slot_pk" PRIMARY KEY("pokemon_id","slot"),
	CONSTRAINT "pokemon_moves_slot_range" CHECK ("pokemon_moves"."slot" BETWEEN 1 AND 4),
	CONSTRAINT "pokemon_moves_pp_ups_range" CHECK ("pokemon_moves"."pp_ups" BETWEEN 0 AND 3)
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "goal_type" DEFAULT 'custom' NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pokemon_id" uuid,
	"action" "history_action" NOT NULL,
	"summary" text,
	"changes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pokemon_id" uuid,
	"title" varchar(150),
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"criteria" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "import_source" NOT NULL,
	"version" varchar(100),
	"status" "import_status" DEFAULT 'running' NOT NULL,
	"stats" jsonb,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "abilities" ADD CONSTRAINT "abilities_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abilities" ADD CONSTRAINT "abilities_introduced_game_id_games_id_fk" FOREIGN KEY ("introduced_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_introduced_game_id_games_id_fk" FOREIGN KEY ("introduced_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_introduced_game_id_games_id_fk" FOREIGN KEY ("introduced_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_introduced_game_id_games_id_fk" FOREIGN KEY ("introduced_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_introduced_game_id_games_id_fk" FOREIGN KEY ("introduced_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "natures" ADD CONSTRAINT "natures_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "natures" ADD CONSTRAINT "natures_introduced_game_id_games_id_fk" FOREIGN KEY ("introduced_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species" ADD CONSTRAINT "species_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species" ADD CONSTRAINT "species_introduced_game_id_games_id_fk" FOREIGN KEY ("introduced_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "types" ADD CONSTRAINT "types_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "types" ADD CONSTRAINT "types_introduced_game_id_games_id_fk" FOREIGN KEY ("introduced_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "original_trainers" ADD CONSTRAINT "original_trainers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "original_trainers" ADD CONSTRAINT "original_trainers_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_tera_type_id_types_id_fk" FOREIGN KEY ("tera_type_id") REFERENCES "public"."types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_original_trainer_id_original_trainers_id_fk" FOREIGN KEY ("original_trainer_id") REFERENCES "public"."original_trainers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_origin_game_id_games_id_fk" FOREIGN KEY ("origin_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_box_id_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_ball_id_balls_id_fk" FOREIGN KEY ("ball_id") REFERENCES "public"."balls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_nature_id_natures_id_fk" FOREIGN KEY ("nature_id") REFERENCES "public"."natures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_ability_id_abilities_id_fk" FOREIGN KEY ("ability_id") REFERENCES "public"."abilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_held_item_id_items_id_fk" FOREIGN KEY ("held_item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_moves" ADD CONSTRAINT "pokemon_moves_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_moves" ADD CONSTRAINT "pokemon_moves_move_id_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."moves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_tokens_user_id_idx" ON "auth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "original_trainers_user_id_idx" ON "original_trainers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "boxes_user_id_idx" ON "boxes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pokemon_user_id_idx" ON "pokemon" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pokemon_species_id_idx" ON "pokemon" USING btree ("species_id");--> statement-breakpoint
CREATE INDEX "pokemon_box_id_idx" ON "pokemon" USING btree ("box_id");--> statement-breakpoint
CREATE INDEX "pokemon_location_idx" ON "pokemon" USING btree ("location");--> statement-breakpoint
CREATE INDEX "pokemon_tags_gin_idx" ON "pokemon" USING gin ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "pokemon_box_slot_unique" ON "pokemon" USING btree ("box_id","slot") WHERE "pokemon"."box_id" IS NOT NULL AND "pokemon"."slot" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "pokemon_moves_pokemon_move_unique" ON "pokemon_moves" USING btree ("pokemon_id","move_id");--> statement-breakpoint
CREATE INDEX "pokemon_moves_move_id_idx" ON "pokemon_moves" USING btree ("move_id");--> statement-breakpoint
CREATE INDEX "goals_user_id_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "history_user_id_idx" ON "history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "history_pokemon_id_idx" ON "history" USING btree ("pokemon_id");--> statement-breakpoint
CREATE INDEX "history_created_at_idx" ON "history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_pokemon_id_idx" ON "notes" USING btree ("pokemon_id");--> statement-breakpoint
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches" USING btree ("user_id");