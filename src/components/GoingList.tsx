import Link from "next/link";
import { removeSignup } from "@/app/admin/actions";
import type { PlayerRecord } from "@/lib/stats";
import { PlayerDot } from "./ui";

/** Who signed up for an upcoming session; the admin also gets a "×" to take someone off. */
export function GoingList({
  sessionId,
  players,
  colors,
  admin,
}: {
  sessionId: number;
  players: PlayerRecord[];
  colors: Map<number, string>;
  admin: boolean;
}) {
  if (players.length === 0) {
    return <p className="border-t border-ivory-line py-3 text-ink-muted">Nobody yet. Be the first to sign up.</p>;
  }
  return (
    <ul className="md:grid md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-x-6">
      {players.map((p) => (
        <li key={p.id} className="flex min-h-12 items-center gap-2.5 border-t border-ivory-line">
          <PlayerDot color={colors.get(p.id)} />
          <Link
            href={`/players/${p.slug}`}
            className="min-w-0 flex-1 truncate py-3 text-[14.5px] font-semibold text-ink hover:text-brass-dark md:text-[15px] md:font-bold"
          >
            {p.name}
          </Link>
          {admin && (
            <form action={removeSignup}>
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="playerId" value={p.id} />
              <button
                type="submit"
                aria-label={`Remove ${p.name}`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-ink-muted hover:bg-ivory-line hover:text-chip-dark"
              >
                ×
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
