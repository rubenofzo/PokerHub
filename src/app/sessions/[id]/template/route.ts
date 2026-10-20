import { isAdmin } from "@/lib/auth";
import { getHub } from "@/lib/data";
import { templateCsv, templateFilename } from "@/lib/sheet";

/**
 * Admin only: a CSV for an upcoming session with one row per signed-up player and the
 * amounts empty, ready to fill in and upload back on the session page.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  const { id } = await ctx.params;
  const { upcoming } = await getHub();
  const session = upcoming.find((s) => s.id === Number(id));
  if (!session) return new Response("Not found", { status: 404 });

  return new Response(templateCsv(session.going.map((p) => p.name)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${templateFilename(session.id, session.date)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
