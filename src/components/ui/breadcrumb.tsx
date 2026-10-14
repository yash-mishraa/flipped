"use client";

import Link from "next/link";
import { FlippedSymbol } from "@/components/FlippedLogo";

export interface BreadcrumbNavigationProps {
  readonly pathname: string;
  readonly onOpenInstructions?: () => void;
}

const links = [
  { href: "/daily", label: "Daily" },
  { href: "/classic", label: "Classic" },
  { href: "/archive", label: "Archive" },
  { href: "/stats", label: "Statistics" },
] as const;

function Separator(): React.JSX.Element {
  return <span className="breadcrumb-separator text-stone-300 mx-1 select-none" aria-hidden="true">/</span>;
}

export default function BreadcrumbNavigation({
  pathname,
}: BreadcrumbNavigationProps): React.JSX.Element {
  return (
    <nav className="breadcrumb-navigation" aria-label="Main Navigation">
      <Link href="/" aria-label="Flipped home" aria-current={pathname === "/" ? "page" : undefined} className="breadcrumb-home flex items-center gap-2">
        <FlippedSymbol size={18} variant="crimson" />
        <span>FLIPPED</span>
      </Link>
      <Separator />
      {links.map(({ href, label }, index) => (
        <span className="breadcrumb-item" key={href}>
          {index > 0 && <Separator />}
          <Link href={href} aria-current={pathname === href ? "page" : undefined}>
            <span>{label}</span>
          </Link>
        </span>
      ))}
      <span className="breadcrumb-item breadcrumb-utilities">
        <Separator />
        <Link href="/#how-to-play" className="inline-flex items-center">
          <span>How to Play</span>
        </Link>
      </span>
    </nav>
  );
}
