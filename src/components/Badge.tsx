import clsx from "clsx";
import type { RarityTier } from "@/achievements/engine";

/** Ring colour per rarity tier; locked badges are greyed out. */
const RING: Record<RarityTier, string> = {
  common: "#a9c1b4",
  uncommon: "#7fb8e6",
  rare: "#e2c27e",
  ultra: "#e0675c",
};

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
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const dims = size === "lg" ? "h-16 w-16 text-2xl" : size === "sm" ? "h-10 w-10 text-base" : "h-12 w-12 text-xl";
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
