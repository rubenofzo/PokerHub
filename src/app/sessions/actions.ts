"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { cleanName } from "@/lib/names";
import { resolvePlayer } from "@/lib/players";

export type SignUpState = { error?: string; message?: string };

/** Keeps a single going list from being flooded; far above any real table. */
const MAX_SIGNUPS = 30;
const MAX_NAME = 40;

/**
 * Public: puts a name on an upcoming session's going list. An existing name or alias (any
 * casing) signs that player up; a new name creates the player. There are no accounts, so
 * anyone with the link can sign anyone up, which matches how the group already works.
 */
export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  // Honeypot: a field people never see. Bots that fill it get a quiet success.
  if (String(formData.get("website") ?? "") !== "") return { message: "You're on the list." };

  const sessionId = Number(formData.get("sessionId"));
  const name = cleanName(String(formData.get("name") ?? ""));
  if (!name) return { error: "Type your name first." };
  if (name.length > MAX_NAME) return { error: `Keep the name under ${MAX_NAME} characters.` };
  if (!/^[\p{L}\p{N}]/u.test(name)) return { error: "A name starts with a letter or a digit." };
  if (!Number.isInteger(sessionId) || sessionId <= 0) return { error: "Unknown session." };

  try {
    const outcome = await getDb().transaction(async (tx) => {
      // Lock the session row: sign-ups queue behind each other and behind a results upload,
      // so the cap holds and nobody lands on a session that was just played.
      const [session] = await tx
        .select({ id: schema.sessions.id })
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId))
        .for("update");
      if (!session) return { error: "That session no longer exists." };
      const [{ played }] = await tx
        .select({ played: count() })
        .from(schema.results)
        .where(eq(schema.results.sessionId, sessionId));
      if (played > 0) return { error: "This session has been played already." };
      const [{ going }] = await tx
        .select({ going: count() })
        .from(schema.signups)
        .where(eq(schema.signups.sessionId, sessionId));
      // Checked before resolving, so a full list never creates a player.
      if (going >= MAX_SIGNUPS) return { error: "The list is full." };

      const player = await resolvePlayer(tx, name);
      const [already] = await tx
        .select()
        .from(schema.signups)
        .where(and(eq(schema.signups.sessionId, sessionId), eq(schema.signups.playerId, player.id)));
      if (already) return { message: `${player.name} is already going.` };
      await tx.insert(schema.signups).values({ sessionId, playerId: player.id }).onConflictDoNothing();
      return { message: `${player.name} is going. See you at the table!` };
    });
    revalidatePath("/", "layout");
    return outcome;
  } catch (err) {
    console.error(err);
    return { error: "Signing up failed. Try again in a moment." };
  }
}
