import type { Metadata } from "next";
import Link from "next/link";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";
import { LoginForm } from "@/components/LoginForm";
import { SessionEditor } from "@/components/SessionEditor";
import { CardPanel, SectionTitle } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { getHub } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { formatEuro } from "@/lib/money";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto w-full max-w-md">
        <CardPanel className="flex flex-col gap-4">
          <SectionTitle>Dealer only</SectionTitle>
          <p className="text-ink-muted">Sign in to upload, edit or delete sessions.</p>
          <LoginForm />
        </CardPanel>
      </main>
    );
  }

  const { allPlayers, aliases, stats } = await getHub();
  const sessions = [...stats.sessions].reverse();

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-5xl">Admin</h1>
        <form action={logout}>
          <button type="submit" className="min-h-11 px-4 font-semibold text-brass hover:text-ivory">
            Sign out
          </button>
        </form>
      </div>

      <CardPanel className="flex flex-col gap-4">
        <SectionTitle>Upload a session</SectionTitle>
        <SessionEditor players={allPlayers} aliases={aliases} />
      </CardPanel>

      <CardPanel className="flex flex-col gap-2">
        <SectionTitle>Sessions</SectionTitle>
        {sessions.length === 0 ? (
          <p className="text-ink-muted">Nothing uploaded yet.</p>
        ) : (
          <ul>
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-ivory-line py-3">
                <Link href={`/sessions/${s.id}`} className="flex flex-col">
                  <span className="font-bold text-ink">{formatDate(s.date)}</span>
                  <span className="text-sm text-ink-muted">
                    {s.results.length} players · {formatEuro(s.potCents)} pot
                  </span>
                </Link>
                <span className="flex items-center gap-2">
                  <Link
                    href={`/admin/sessions/${s.id}`}
                    className="inline-flex min-h-10 items-center rounded-full border-2 border-felt px-4 text-sm font-bold text-felt hover:bg-felt hover:text-ivory"
                  >
                    Edit
                  </Link>
                  <DeleteSessionButton sessionId={s.id} label={formatDate(s.date)} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardPanel>
    </main>
  );
}
