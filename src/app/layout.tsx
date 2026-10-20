import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { SiteHeader } from "@/components/SiteHeader";
import { FeltPanel } from "@/components/ui";
import { getSetupProblem } from "@/lib/data";
import "./globals.css";

const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-dm-serif" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "PokerHub", template: "%s · PokerHub" },
  description: "Results, stats and achievements for our poker nights.",
  robots: { index: false, follow: false },
};

// viewportFit "cover" lets the bottom tab bar pad itself for the home indicator.
export const viewport: Viewport = { themeColor: "#0e3b2c", viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const problem = await getSetupProblem();
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pt-3.5 pb-[calc(84px+env(safe-area-inset-bottom))] md:gap-8 md:px-6 md:pt-10 md:pb-16">
          {problem ? (
            <FeltPanel className="mx-auto mt-16 flex max-w-xl flex-col gap-3 text-center">
              <h1 className="font-display text-4xl">PokerHub isn&rsquo;t dealt in yet</h1>
              <p className="text-mist">{problem}</p>
            </FeltPanel>
          ) : (
            <>
              <SiteHeader />
              {children}
              <BottomNav />
            </>
          )}
        </div>
      </body>
    </html>
  );
}
