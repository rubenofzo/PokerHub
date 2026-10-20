"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Home",
    match: (p: string) => p === "/" || p.startsWith("/sessions"),
    icon: (
      <>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </>
    ),
  },
  {
    href: "/players",
    label: "Players",
    match: (p: string) => p.startsWith("/players"),
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M17 14.5c2.3 0 4 1.5 4.6 4" />
      </>
    ),
  },
  {
    href: "/achievements",
    label: "Achievements",
    match: (p: string) => p.startsWith("/achievements"),
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 3v3" />
        <path d="M12 18v3" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
      </>
    ),
  },
];

/** Phone-only tab bar fixed to the bottom of the screen. Desktop uses the header nav. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-felt-deep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex h-[68px] flex-col items-center justify-center gap-1 text-[11px]",
              active ? "font-bold text-brass" : "font-semibold text-mist hover:text-ivory",
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {t.icon}
            </svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
