import { boxes, forms, pokemon, species, users, type Box } from "@enredex/database";
import { and, asc, count, eq, max } from "drizzle-orm";
import { errors } from "../../lib/errors.js";
import type { DbOrTx } from "../../lib/db.js";

export const BOX_LIMITS = { free: 1, premium: 200 } as const;

export async function assertCanCreateBox(db: DbOrTx, userId: string) {
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
    columns: { homePlan: true },
  });
  if (!user) throw errors.notFound("User not found");
  const limit = BOX_LIMITS[user.homePlan];
  const [row] = await db
    .select({ value: count() })
    .from(boxes)
    .where(eq(boxes.userId, userId));
  if ((row?.value ?? 0) >= limit) {
    throw errors.conflict(
      `Box limit reached for the ${user.homePlan} plan (${limit})`,
    );
  }
}

export async function getBoxOrThrow(
  db: DbOrTx,
  userId: string,
  boxId: string,
): Promise<Box> {
  const box = await db.query.boxes.findFirst({
    where: (b, { and, eq }) => and(eq(b.id, boxId), eq(b.userId, userId)),
  });
  if (!box) throw errors.notFound("Box not found");
  return box;
}

export async function nextBoxPosition(
  db: DbOrTx,
  userId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: max(boxes.position) })
    .from(boxes)
    .where(eq(boxes.userId, userId));
  return (row?.value ?? 0) + 1;
}

export async function listBoxes(db: DbOrTx, userId: string) {
  return db
    .select({
      id: boxes.id,
      name: boxes.name,
      position: boxes.position,
      pokemonCount: count(pokemon.id),
      createdAt: boxes.createdAt,
      updatedAt: boxes.updatedAt,
    })
    .from(boxes)
    .leftJoin(pokemon, eq(pokemon.boxId, boxes.id))
    .where(eq(boxes.userId, userId))
    .groupBy(boxes.id)
    .orderBy(asc(boxes.position));
}

/** Box detail with its 30-slot occupancy (for the 6x5 grid UI). */
export async function getBoxWithOccupants(
  db: DbOrTx,
  userId: string,
  boxId: string,
) {
  const box = await getBoxOrThrow(db, userId, boxId);
  const occupants = await db
    .select({
      id: pokemon.id,
      slot: pokemon.slot,
      speciesId: pokemon.speciesId,
      speciesName: species.name,
      nationalDexNumber: species.nationalDexNumber,
      pokeapiId: species.pokeapiId,
      formId: pokemon.formId,
      formName: forms.name,
      nickname: pokemon.nickname,
      gender: pokemon.gender,
      level: pokemon.level,
      isShiny: pokemon.isShiny,
      isAlpha: pokemon.isAlpha,
      isGigantamax: pokemon.isGigantamax,
      isFavorite: pokemon.isFavorite,
      isLocked: pokemon.isLocked,
    })
    .from(pokemon)
    .innerJoin(species, eq(pokemon.speciesId, species.id))
    .leftJoin(forms, eq(pokemon.formId, forms.id))
    .where(and(eq(pokemon.boxId, box.id), eq(pokemon.userId, userId)))
    .orderBy(asc(pokemon.slot));
  return { ...box, occupants };
}
