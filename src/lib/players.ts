import "server-only";
import { and, eq, inArray, notExists } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { normalizeName, slugify } from "./names";

export type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type Player = typeof schema.players.$inferSelect;

/** A mistake the person can fix (shown as is), as opposed to a server failure. */
export class UserError extends Error {}

/**
 * Loads the players and aliases once and returns a function that matches a name to a player
 * the way every sheet does: case, accents and spacing don't matter, aliases count, and an
 * unknown name creates a new player with a unique slug. Used by uploads and sign-ups alike.
 *
 * `chosenId` is an existing player picked by hand (the upload preview); a new spelling for
 * them is remembered as an alias.
 */
export async function playerResolver(tx: Tx) {
  const players = await tx.select().from(schema.players);
  const aliases = await tx.select().from(schema.playerAliases);
  const byKey = new Map<string, number>();
  for (const p of players) byKey.set(normalizeName(p.name), p.id);
  for (const a of aliases) if (!byKey.has(a.alias)) byKey.set(a.alias, a.playerId);
  const usedSlugs = new Set(players.map((p) => p.slug));
  const known = new Map<number, Player>(players.map((p) => [p.id, p]));

  return async function resolve(name: string, chosenId: number | null = null): Promise<Player> {
    const key = normalizeName(name);
    if (chosenId !== null) {
      const player = known.get(chosenId);
      if (!player) throw new UserError(`Player for "${name}" no longer exists.`);
      if (normalizeName(player.name) !== key && !byKey.has(key)) {
        await tx.insert(schema.playerAliases).values({ alias: key, playerId: player.id }).onConflictDoNothing();
        byKey.set(key, player.id);
      }
      return player;
    }
    const existing = byKey.get(key);
    if (existing !== undefined) return known.get(existing)!;

    let slug = slugify(name);
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(name)}-${n}`;
    usedSlugs.add(slug);
    const [created] = await tx.insert(schema.players).values({ name, slug }).returning();
    byKey.set(key, created.id);
    known.set(created.id, created);
    return created;
  };
}

/** Matches one name to a player, creating them when the name is new. */
export async function resolvePlayer(tx: Tx, name: string): Promise<Player> {
  return (await playerResolver(tx))(name);
}

/**
 * Deletes those of the given players who have no results and are on no going list (a typo
 * in a sign-up, or someone who signed up and never played). Called after an upload with the
 * sign-ups it cleared, after the admin removes a sign-up, and after an upcoming session is
 * deleted. Players with results are never touched.
 */
export async function deleteIdlePlayers(tx: Tx, playerIds: Iterable<number>): Promise<void> {
  const ids = [...new Set(playerIds)];
  if (ids.length === 0) return;
  await tx
    .delete(schema.players)
    .where(
      and(
        inArray(schema.players.id, ids),
        notExists(tx.select().from(schema.results).where(eq(schema.results.playerId, schema.players.id))),
        notExists(tx.select().from(schema.signups).where(eq(schema.signups.playerId, schema.players.id))),
      ),
    );
}
