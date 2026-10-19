"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { endAdminSession, passwordMatches, requireAdmin, startAdminSession } from "@/lib/auth";
import { cleanName, normalizeName, slugify } from "@/lib/names";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD) return { error: "ADMIN_PASSWORD is not configured on the server." };
  if (!passwordMatches(password)) return { error: "Wrong password." };
  await startAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/");
}

const rowSchema = z.object({
  name: z.string().transform(cleanName).pipe(z.string().min(1, "Every row needs a name.")),
  moneyInCents: z.number().int().min(0),
  moneyOutCents: z.number().int().min(0),
  buyIns: z.number().int().min(0).nullable(),
  /** An existing player chosen in the preview, or null to match by name / create. */
  playerId: z.number().int().positive().nullable(),
});

const sessionSchema = z.object({
  sessionId: z.number().int().positive().nullable(),
  date: z.iso.date("Pick a valid date."),
  note: z.string().trim().max(500).nullable(),
  sourceFilename: z.string().trim().max(200).nullable(),
  rows: z.array(rowSchema).min(1, "Add at least one player."),
});

export type SaveSessionInput = z.input<typeof sessionSchema>;
export type SaveSessionResult = { ok: true; sessionId: number } | { ok: false; error: string };

export async function saveSession(input: SaveSessionInput): Promise<SaveSessionResult> {
  await requireAdmin();
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid session." };
  const data = parsed.data;

  try {
    const sessionId = await getDb().transaction(async (tx) => {
      const players = await tx.select().from(schema.players);
      const aliases = await tx.select().from(schema.playerAliases);
      const byKey = new Map<string, number>();
      for (const p of players) byKey.set(normalizeName(p.name), p.id);
      for (const a of aliases) if (!byKey.has(a.alias)) byKey.set(a.alias, a.playerId);
      const usedSlugs = new Set(players.map((p) => p.slug));
      const known = new Map(players.map((p) => [p.id, p]));

      const resolved: { playerId: number; row: (typeof data.rows)[number] }[] = [];
      for (const row of data.rows) {
        const key = normalizeName(row.name);
        let playerId: number;
        if (row.playerId !== null) {
          const player = known.get(row.playerId);
          if (!player) throw new UserError(`Player for "${row.name}" no longer exists.`);
          playerId = player.id;
          if (normalizeName(player.name) !== key && !byKey.has(key)) {
            await tx.insert(schema.playerAliases).values({ alias: key, playerId }).onConflictDoNothing();
            byKey.set(key, playerId);
          }
        } else if (byKey.has(key)) {
          playerId = byKey.get(key)!;
        } else {
          let slug = slugify(row.name);
          for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(row.name)}-${n}`;
          usedSlugs.add(slug);
          const [created] = await tx
            .insert(schema.players)
            .values({ name: row.name, slug })
            .returning();
          playerId = created.id;
          byKey.set(key, playerId);
          known.set(playerId, created);
        }
        if (resolved.some((r) => r.playerId === playerId)) {
          throw new UserError(`${known.get(playerId)?.name ?? row.name} appears twice in this session.`);
        }
        resolved.push({ playerId, row });
      }

      let id = data.sessionId;
      const values = { date: data.date, note: data.note || null, sourceFilename: data.sourceFilename || null };
      if (id !== null) {
        const updated = await tx
          .update(schema.sessions)
          .set(values)
          .where(eq(schema.sessions.id, id))
          .returning({ id: schema.sessions.id });
        if (updated.length === 0) throw new UserError("That session no longer exists.");
        await tx.delete(schema.results).where(eq(schema.results.sessionId, id));
      } else {
        const [created] = await tx.insert(schema.sessions).values(values).returning({ id: schema.sessions.id });
        id = created.id;
      }

      await tx.insert(schema.results).values(
        resolved.map(({ playerId, row }) => ({
          sessionId: id!,
          playerId,
          moneyInCents: row.moneyInCents,
          moneyOutCents: row.moneyOutCents,
          buyIns: row.buyIns,
        })),
      );
      return id;
    });

    revalidatePath("/", "layout");
    return { ok: true, sessionId };
  } catch (err) {
    if (err instanceof UserError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Saving failed. Check the server logs." };
  }
}

export async function deleteSession(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("sessionId"));
  if (!Number.isInteger(id) || id <= 0) return;
  await getDb().delete(schema.sessions).where(eq(schema.sessions.id, id));
  revalidatePath("/", "layout");
  redirect("/admin");
}

class UserError extends Error {}
