import type { Metadata } from "next";
import { AchievementList } from "@/components/AchievementList";
import { PageTitle } from "@/components/ui";
import { getHub } from "@/lib/data";
import { achievementViews } from "@/lib/views";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const { achievements, stats } = await getHub();
  const views = achievementViews(stats, achievements);
  const unlocked = views.filter((a) => !a.locked).length;

  return (
    <main className="flex flex-col gap-3 md:gap-6">
      <div className="flex flex-col gap-1.5 md:gap-1">
        <PageTitle>Achievements</PageTitle>
        <p className="text-[12.5px] text-mist md:text-base">
          <span className="md:hidden">
            {unlocked} of {views.length} unlocked · rarity is the share of the {stats.players.length} players
          </span>
          <span className="hidden md:inline">
            Rarity is the share of the {stats.players.length} players who have earned it.
          </span>
        </p>
      </div>
      <AchievementList achievements={views} playerCount={stats.players.length} />
    </main>
  );
}
