import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-dm-serif" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "PokerHub", template: "%s · PokerHub" },
  description: "Results, stats and achievements for our poker nights.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0e3b2c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
