import { relations } from "drizzle-orm";
import { boxes } from "./boxes.js";
import { goals, history, notes, savedSearches } from "./collection.js";
import { pokemon, pokemonMoves } from "./pokemon.js";
import {
  abilities,
  balls,
  forms,
  games,
  generations,
  items,
  moves,
  natures,
  species,
  types,
} from "./reference.js";
import { originalTrainers } from "./trainers.js";
import { authTokens, refreshTokens, users } from "./users.js";

export const usersRelations = relations(users, ({ many }) => ({
  pokemon: many(pokemon),
  boxes: many(boxes),
  originalTrainers: many(originalTrainers),
  notes: many(notes),
  goals: many(goals),
  savedSearches: many(savedSearches),
  history: many(history),
  refreshTokens: many(refreshTokens),
  authTokens: many(authTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  user: one(users, {
    fields: [authTokens.userId],
    references: [users.id],
  }),
}));

export const boxesRelations = relations(boxes, ({ one, many }) => ({
  user: one(users, { fields: [boxes.userId], references: [users.id] }),
  pokemon: many(pokemon),
}));

export const originalTrainersRelations = relations(
  originalTrainers,
  ({ one, many }) => ({
    user: one(users, {
      fields: [originalTrainers.userId],
      references: [users.id],
    }),
    game: one(games, {
      fields: [originalTrainers.gameId],
      references: [games.id],
    }),
    pokemon: many(pokemon),
  }),
);

export const pokemonRelations = relations(pokemon, ({ one, many }) => ({
  user: one(users, { fields: [pokemon.userId], references: [users.id] }),
  species: one(species, {
    fields: [pokemon.speciesId],
    references: [species.id],
  }),
  form: one(forms, { fields: [pokemon.formId], references: [forms.id] }),
  teraType: one(types, {
    fields: [pokemon.teraTypeId],
    references: [types.id],
  }),
  originalTrainer: one(originalTrainers, {
    fields: [pokemon.originalTrainerId],
    references: [originalTrainers.id],
  }),
  originGame: one(games, {
    fields: [pokemon.originGameId],
    references: [games.id],
  }),
  box: one(boxes, { fields: [pokemon.boxId], references: [boxes.id] }),
  nature: one(natures, {
    fields: [pokemon.natureId],
    references: [natures.id],
  }),
  ability: one(abilities, {
    fields: [pokemon.abilityId],
    references: [abilities.id],
  }),
  ball: one(balls, { fields: [pokemon.ballId], references: [balls.id] }),
  heldItem: one(items, {
    fields: [pokemon.heldItemId],
    references: [items.id],
  }),
  moves: many(pokemonMoves),
  notes: many(notes),
}));

export const pokemonMovesRelations = relations(pokemonMoves, ({ one }) => ({
  pokemon: one(pokemon, {
    fields: [pokemonMoves.pokemonId],
    references: [pokemon.id],
  }),
  move: one(moves, {
    fields: [pokemonMoves.moveId],
    references: [moves.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  pokemon: one(pokemon, {
    fields: [notes.pokemonId],
    references: [pokemon.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  user: one(users, {
    fields: [savedSearches.userId],
    references: [users.id],
  }),
}));

export const historyRelations = relations(history, ({ one }) => ({
  user: one(users, { fields: [history.userId], references: [users.id] }),
  pokemon: one(pokemon, {
    fields: [history.pokemonId],
    references: [pokemon.id],
  }),
}));

export const generationsRelations = relations(generations, ({ many }) => ({
  games: many(games),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  generation: one(generations, {
    fields: [games.generationId],
    references: [generations.id],
  }),
}));

export const speciesRelations = relations(species, ({ many }) => ({
  forms: many(forms),
  pokemon: many(pokemon),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  species: one(species, {
    fields: [forms.speciesId],
    references: [species.id],
  }),
  pokemon: many(pokemon),
}));

export const typesRelations = relations(types, ({ many }) => ({
  moves: many(moves),
}));

export const movesRelations = relations(moves, ({ one, many }) => ({
  type: one(types, { fields: [moves.typeId], references: [types.id] }),
  pokemonMoves: many(pokemonMoves),
}));
