"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { endAdminSession, passwordMatches, requireAdmin, startAdminSession } from "@/lib/auth";
import { cleanName } from "@/lib/names";
import { deleteIdlePlayers, playerResolver, UserError } from "@/lib/players";

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
      if (data.sessionId !== null) {
        // Lock the session first, so a sign-up can't slip in while its results are saved.
        const [locked] = await tx
          .select({ id: schema.sessions.id })
          .from(schema.sessions)
          .where(eq(schema.sessions.id, data.sessionId))
          .for("update");
        if (!locked) throw new UserError("That session no longer exists.");
      }
      const resolve = await playerResolver(tx);
      const resolved: { playerId: number; row: (typeof data.rows)[number] }[] = [];
      for (const row of data.rows) {
        const player = await resolve(row.name, row.playerId);
        if (resolved.some((r) => r.playerId === player.id)) {
          throw new UserError(`${player.name} appears twice in this session.`);
        }
        resolved.push({ playerId: player.id, row });
      }

      let id = data.sessionId;
      // Players whose sign-ups this upload clears; checked once the new results are in.
      const signedUp: number[] = [];
      const values = { date: data.date, note: data.note || null, sourceFilename: data.sourceFilename || null };
      if (id !== null) {
        const updated = await tx
          .update(schema.sessions)
          .set(values)
          .where(eq(schema.sessions.id, id))
          .returning({ id: schema.sessions.id });
        if (updated.length === 0) throw new UserError("That session no longer exists.");
        // The results replace the going list.
        const signups = await tx
          .delete(schema.signups)
          .where(eq(schema.signups.sessionId, id))
          .returning({ playerId: schema.signups.playerId });
        await tx.delete(schema.results).where(eq(schema.results.sessionId, id));
        signedUp.push(...signups.map((s) => s.playerId));
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
      await deleteIdlePlayers(tx, signedUp);
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
  await getDb().transaction(async (tx) => {
    const [played] = await tx
      .select({ sessionId: schema.results.sessionId })
      .from(schema.results)
      .where(eq(schema.results.sessionId, id))
      .limit(1);
    const signups = await tx.select().from(schema.signups).where(eq(schema.signups.sessionId, id));
    await tx.delete(schema.sessions).where(eq(schema.sessions.id, id));
    // Only an upcoming session's sign-ups can leave someone with nothing; deleting a played
    // session never deletes players.
    if (!played) await deleteIdlePlayers(tx, signups.map((s) => s.playerId));
  });
  revalidatePath("/", "layout");
  redirect("/admin");
}

export type DetailsState = { error?: string; saved?: boolean };

const detailsSchema = z.object({
  date: z.iso.date("Pick a date, or tick Date TBD.").nullable(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time, or tick Time TBD.")
    .nullable(),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").nullable(),
});

/** Date, time and note from the plan / edit details form; ticking TBD sends null. */
function readDetails(formData: FormData) {
  const field = (name: string) => String(formData.get(name) ?? "").trim();
  return detailsSchema.safeParse({
    date: formData.get("dateTbd") ? null : field("date"),
    startTime: formData.get("timeTbd") ? null : field("startTime"),
    note: field("note") || null,
  });
}

/** Plans an upcoming session (no results yet) and opens its page. */
export async function planSession(_prev: DetailsState, formData: FormData): Promise<DetailsState> {
  await requireAdmin();
  const parsed = readDetails(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  const [created] = await getDb()
    .insert(schema.sessions)
    .values(parsed.data)
    .returning({ id: schema.sessions.id });
  revalidatePath("/", "layout");
  redirect(`/sessions/${created.id}`);
}

/** Changes the date, time and note of an upcoming session. */
export async function updateSessionDetails(_prev: DetailsState, formData: FormData): Promise<DetailsState> {
  await requireAdmin();
  const id = Number(formData.get("sessionId"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Unknown session." };
  const parsed = readDetails(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  const [played] = await getDb()
    .select({ sessionId: schema.results.sessionId })
    .from(schema.results)
    .where(eq(schema.results.sessionId, id))
    .limit(1);
  if (played) return { error: "This session has results; edit it from the admin page." };
  const updated = await getDb()
    .update(schema.sessions)
    .set(parsed.data)
    .where(eq(schema.sessions.id, id))
    .returning({ id: schema.sessions.id });
  if (updated.length === 0) return { error: "That session no longer exists." };
  revalidatePath("/", "layout");
  return { saved: true };
}

/** Takes a player off a going list; a player left with no results and no sign-ups is deleted. */
export async function removeSignup(formData: FormData): Promise<void> {
  await requireAdmin();
  const sessionId = Number(formData.get("sessionId"));
  const playerId = Number(formData.get("playerId"));
  if (!Number.isInteger(sessionId) || !Number.isInteger(playerId)) return;
  await getDb().transaction(async (tx) => {
    await tx
      .delete(schema.signups)
      .where(and(eq(schema.signups.sessionId, sessionId), eq(schema.signups.playerId, playerId)));
    await deleteIdlePlayers(tx, [playerId]);
  });
  revalidatePath("/", "layout");
}
