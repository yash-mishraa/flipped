"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const navItems = [
  { href: "/daily", label: "Daily" },
  { href: "/classic", label: "Classic" },
  { href: "/archive", label: "Archive" },
  { href: "/stats", label: "Statistics" },
] as const;

export function Header(): React.JSX.Element {
  const pathname = usePathname();
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#C49A6C]/25 bg-[#F7F0E5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2 sm:px-6">
          {/* Brand Logo Lockup */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] rounded-lg"
            aria-label="FLIPPED Home"
          >
            <FlippedSymbol size={20} variant="crimson" />
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#32171D] group-hover:text-[#7B1E2B] transition">
              FLIPPED
            </span>
          </Link>

          {/* Navigation Bar using Tabs Component */}
          <Tabs value={pathname} className="mx-1 max-w-full overflow-x-auto scrollbar-none">
            <TabsList
              variant="button"
              shape="pill"
              size="sm"
              className="bg-[#faeee0]/80 p-0.5 border border-[#C49A6C]/30 flex-nowrap"
            >
              {navItems.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <TabsTrigger
                    key={href}
                    value={href}
                    asChild
                    className={`text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full transition ${
                      isActive
                        ? "bg-[#7B1E2B] text-[#F7F0E5]"
                        : "text-[#6B4E55] hover:text-[#32171D]"
                    }`}
                  >
                    <Link href={href}>{label}</Link>
                  </TabsTrigger>
                );
              })}

              <TabsTrigger
                value="how-to-play"
                onClick={() => setShowTutorial(true)}
                className="text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full text-[#6B4E55] hover:text-[#32171D] transition cursor-pointer"
              >
                How to Play
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* User Button if signed in (Sign-in button removed as requested) */}
          <div className="flex shrink-0 items-center">
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 border border-[#C49A6C]",
                  },
                }}
              />
            </Show>
          </div>
        </div>
      </header>

      {/* Tutorial / How to Play Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}
