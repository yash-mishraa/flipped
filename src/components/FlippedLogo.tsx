import React from "react";
import Link from "next/link";

export type FlippedSymbolVariant =
  | "crimson"
  | "cream"
  | "dark-wine"
  | "cream-on-crimson"
  | "crimson-on-cream"
  | "monochrome";

export interface FlippedSymbolProps {
  size?: number;
  className?: string;
  variant?: FlippedSymbolVariant;
  ariaHidden?: boolean;
}

/**
 * Official Flipped split-F signature symbol.
 * Source grid: 64 × 64.
 * Spine: 16 units. Open seam: 8 units.
 * Diagonal cuts: 45° at top bar (dx=-16, dy=16) and middle tile (dx=-16, dy=16).
 */
export function FlippedSymbol({
  size = 28,
  className = "",
  variant = "crimson",
  ariaHidden = true,
}: FlippedSymbolProps): React.JSX.Element {
  const isBoxed = variant === "cream-on-crimson" || variant === "crimson-on-cream";

  if (isBoxed) {
    const isCreamOnCrimson = variant === "cream-on-crimson";
    const bgFill = isCreamOnCrimson ? "#7B1E2B" : "#F7F0E5";
    const symbolFill = isCreamOnCrimson ? "#F7F0E5" : "#7B1E2B";

    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={`shrink-0 overflow-hidden ${className}`}
        aria-hidden={ariaHidden}
      >
        <rect width="64" height="64" rx="10" fill={bgFill} />
        <g transform="translate(8, 8) scale(0.75)">
          <path
            d="M 0 0 L 64 0 L 48 16 L 16 16 L 16 64 L 0 64 Z M 24 24 L 56 24 L 40 40 L 24 40 Z"
            fill={symbolFill}
            fillRule="evenodd"
          />
        </g>
      </svg>
    );
  }

  const fillColors: Record<Exclude<FlippedSymbolVariant, "cream-on-crimson" | "crimson-on-cream">, string> = {
    crimson: "#7B1E2B",
    cream: "#F7F0E5",
    "dark-wine": "#32171D",
    monochrome: "currentColor",
  };

  const fill = fillColors[variant as keyof typeof fillColors] || "#7B1E2B";

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 ${className}`}
      aria-hidden={ariaHidden}
    >
      <path
        d="M 0 0 L 64 0 L 48 16 L 16 16 L 16 64 L 0 64 Z M 24 24 L 56 24 L 40 40 L 24 40 Z"
        fill={fill}
        fillRule="evenodd"
      />
    </svg>
  );
}

export interface FlippedLogoProps {
  height?: number;
  symbolVariant?: FlippedSymbolVariant;
  textColor?: string;
  className?: string;
  href?: string;
}

/**
 * Official Primary Horizontal Lockup.
 * Mark height = h. Wordmark font size = 1.16h, tracking = 0.035h, Gap = 0.5h.
 * Typography: Inter / Extra Bold 800 / uppercase.
 */
export function FlippedLogo({
  height = 26,
  symbolVariant = "crimson",
  textColor = "text-[#32171D]",
  className = "",
  href = "/",
}: FlippedLogoProps): React.JSX.Element {
  const gap = Math.round(height * 0.45);
  const fontSize = Math.round(height * 1.05);

  const content = (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{ gap: `${gap}px` }}
      aria-label="FLIPPED"
    >
      <FlippedSymbol size={height} variant={symbolVariant} />
      <span
        className={`font-[800] uppercase tracking-[-0.015em] leading-none ${textColor}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        FLIPPED
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition">
        {content}
      </Link>
    );
  }

  return content;
}
