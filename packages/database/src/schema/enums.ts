import { pgEnum } from "drizzle-orm/pg-core";

export const homePlanEnum = pgEnum("home_plan", ["free", "premium"]);

export const genderEnum = pgEnum("gender", ["male", "female", "genderless"]);

export const pokemonLocationEnum = pgEnum("pokemon_location", [
  "home",
  "scarlet",
  "violet",
  "sword",
  "shield",
  "legends-arceus",
  "brilliant-diamond",
  "shining-pearl",
  "lets-go-pikachu",
  "lets-go-eevee",
  "pokemon-go",
  "pokemon-bank",
  "other",
]);

export const formTypeEnum = pgEnum("form_type", [
  "standard",
  "regional",
  "mega",
  "gigantamax",
  "other",
]);

export const regionalFormEnum = pgEnum("regional_form", [
  "alolan",
  "galarian",
  "hisuian",
  "paldean",
]);

export const pokemonLanguageEnum = pgEnum("pokemon_language", [
  "ja",
  "en",
  "fr",
  "it",
  "de",
  "es",
  "ko",
  "zh-hans",
  "zh-hant",
]);

export const battleStatEnum = pgEnum("battle_stat", [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
]);

export const damageClassEnum = pgEnum("damage_class", [
  "physical",
  "special",
  "status",
]);

export const authTokenTypeEnum = pgEnum("auth_token_type", [
  "email-verification",
  "password-reset",
]);

export const historyActionEnum = pgEnum("history_action", [
  "create",
  "update",
  "delete",
  "move",
  "import",
  "export",
]);

export const goalTypeEnum = pgEnum("goal_type", ["living-dex", "custom"]);

export const importSourceEnum = pgEnum("import_source", [
  "pokeapi",
  "pokesprite",
  "showdown",
  "seed",
]);

export const importStatusEnum = pgEnum("import_status", [
  "running",
  "success",
  "failed",
]);

export type HomePlan = (typeof homePlanEnum.enumValues)[number];
export type Gender = (typeof genderEnum.enumValues)[number];
export type PokemonLocation = (typeof pokemonLocationEnum.enumValues)[number];
export type FormType = (typeof formTypeEnum.enumValues)[number];
export type RegionalForm = (typeof regionalFormEnum.enumValues)[number];
export type PokemonLanguage = (typeof pokemonLanguageEnum.enumValues)[number];
export type BattleStat = (typeof battleStatEnum.enumValues)[number];
export type DamageClass = (typeof damageClassEnum.enumValues)[number];
export type AuthTokenType = (typeof authTokenTypeEnum.enumValues)[number];
export type HistoryAction = (typeof historyActionEnum.enumValues)[number];
export type GoalType = (typeof goalTypeEnum.enumValues)[number];
export type ImportSource = (typeof importSourceEnum.enumValues)[number];
export type ImportStatus = (typeof importStatusEnum.enumValues)[number];
