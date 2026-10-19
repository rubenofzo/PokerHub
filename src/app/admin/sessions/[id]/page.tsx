import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SessionEditor } from "@/components/SessionEditor";
import { CardPanel, SectionTitle } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { getHub } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Edit session" };

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const { allPlayers, aliases, stats, playerById } = await getHub();
  const session = stats.sessions.find((s) => s.id === Number(id));
  if (!session) notFound();

  return (
    <main className="flex flex-col gap-6">
      <Link href="/admin" className="text-sm font-semibold text-brass">
        ← Admin
      </Link>
      <CardPanel className="flex flex-col gap-4">
        <SectionTitle>Edit session of {formatDate(session.date)}</SectionTitle>
        <SessionEditor
          players={allPlayers}
          aliases={aliases}
          initial={{
            sessionId: session.id,
            date: session.date,
            note: session.note,
            rows: [...session.results]
              .sort((a, b) => (playerById.get(a.playerId)?.name ?? "").localeCompare(playerById.get(b.playerId)?.name ?? ""))
              .map((r) => ({
                name: playerById.get(r.playerId)?.name ?? "",
                moneyInCents: r.moneyInCents,
                moneyOutCents: r.moneyOutCents,
                buyIns: r.buyInsInferred ? null : r.buyIns,
                playerId: r.playerId,
              })),
          }}
        />
      </CardPanel>
    </main>
  );
}
