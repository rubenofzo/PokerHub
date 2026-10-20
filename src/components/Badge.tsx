import clsx from "clsx";
import type { RarityTier } from "@/achievements/engine";

/** Ring colour per rarity tier; locked badges are greyed out. */
const RING: Record<RarityTier, string> = {
  common: "#a9c1b4",
  uncommon: "#8fe0b5",
  rare: "#e2c27e",
  ultra: "#e0675c",
};

/**
 * Sizes. The compound ones change at `md`: "row" is a list row (40px phone, 48px desktop),
 * "showcase" the player showcase (52px / 64px), "detail" the achievement detail (60px / 64px).
 */
const DIMS = {
  sm: "h-10 w-10 text-base",
  md: "h-12 w-12 text-xl",
  row: "h-10 w-10 text-[15px] md:h-12 md:w-12 md:text-xl",
  showcase: "h-[52px] w-[52px] text-lg md:h-16 md:w-16 md:text-2xl",
  detail: "h-[60px] w-[60px] text-2xl md:h-16 md:w-16",
} as const;

export type BadgeSize = keyof typeof DIMS;

export function Badge({
  icon,
  tier,
  locked = false,
  hidden = false,
  size = "md",
  label,
}: {
  icon: string;
  tier: RarityTier;
  locked?: boolean;
  hidden?: boolean;
  size?: BadgeSize;
  label?: string;
}) {
  const dims = DIMS[size];
  const shown = hidden ? "?" : icon;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={clsx(
        "flex flex-none items-center justify-center overflow-hidden rounded-full border-[3px] border-dashed font-display",
        dims,
        locked ? "border-sage bg-felt-deep text-sage grayscale" : "bg-ivory text-felt",
      )}
      style={locked ? undefined : { borderColor: RING[tier] }}
    >
      {shown.startsWith("/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="" className={clsx("h-full w-full object-cover", locked && "opacity-40")} />
      ) : (
        <span className="leading-none">{shown}</span>
      )}
    </span>
  );
}
