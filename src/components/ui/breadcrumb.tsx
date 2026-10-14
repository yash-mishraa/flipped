"use client";

import Link from "next/link";
import { Archive, BarChart2, BookOpen, Calendar, ChevronRight, Compass } from "lucide-react";
import { FlippedSymbol } from "@/components/FlippedLogo";

export interface BreadcrumbNavigationProps {
  readonly pathname: string;
  readonly onOpenInstructions?: () => void;
}

const links = [
  { href: "/daily", label: "Daily", icon: Calendar },
  { href: "/classic", label: "Classic", icon: Compass },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/stats", label: "Statistics", icon: BarChart2 },
] as const;

function Separator(): React.JSX.Element {
  return <ChevronRight className="breadcrumb-separator" aria-hidden="true" />;
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
      {links.map(({ href, label, icon: Icon }, index) => (
        <span className="breadcrumb-item" key={href}>
          {index > 0 && <Separator />}
          <Link href={href} aria-current={pathname === href ? "page" : undefined}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        </span>
      ))}
      <span className="breadcrumb-item breadcrumb-utilities">
        <Separator />
        <Link href="/#how-to-play" className="inline-flex items-center gap-1">
          <BookOpen aria-hidden="true" />
          <span>How to Play</span>
        </Link>
      </span>
    </nav>
  );
}
