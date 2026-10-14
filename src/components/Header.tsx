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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#C49A6C]/25 bg-[#F7F0E5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3.5 py-2 sm:px-6">
          {/* Brand Logo Lockup */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] rounded-lg"
            aria-label="FLIPPED Home"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FlippedSymbol size={20} variant="crimson" />
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#32171D] group-hover:text-[#7B1E2B] transition">
              FLIPPED
            </span>
          </Link>

          {/* Desktop Navigation Bar using Tabs Component (visible on md+) */}
          <div className="hidden md:flex items-center">
            <Tabs value={pathname} className="mx-1">
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
                      className={`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200 ease-out active:scale-[0.96] ${
                        isActive
                          ? "bg-[#7B1E2B] text-[#F7F0E5] shadow-xs"
                          : "text-[#6B4E55] hover:text-[#32171D] hover:bg-black/5"
                      }`}
                    >
                      <Link href={href}>{label}</Link>
                    </TabsTrigger>
                  );
                })}

                <TabsTrigger
                  value="how-to-play"
                  onClick={() => setShowTutorial(true)}
                  className="text-xs font-semibold px-3 py-1 rounded-full text-[#6B4E55] hover:text-[#32171D] hover:bg-black/5 transition-all duration-200 ease-out active:scale-[0.96] cursor-pointer"
                >
                  How to Play
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right Controls: User Profile + Mobile Menu Toggle */}
          <div className="flex shrink-0 items-center gap-2">
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 border border-[#C49A6C]",
                  },
                }}
              />
            </Show>

            {/* Mobile Menu Toggle (hidden on md+, visible on mobile) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="md:hidden inline-flex items-center justify-center rounded-full border border-[#C49A6C]/50 bg-[#faeee0] px-3.5 py-1 text-xs font-bold text-[#32171D] shadow-2xs hover:bg-[#faeee0]/80 active:scale-[0.96] transition-all duration-200 ease-out cursor-pointer"
            >
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="md:hidden border-t border-[#C49A6C]/20 bg-[#F7F0E5]/98 px-3.5 py-2.5 shadow-md backdrop-blur-lg animate-fade-in"
          >
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center rounded-full px-3 py-2 text-xs font-bold transition-all duration-200 ease-out active:scale-[0.96] ${
                      isActive
                        ? "bg-[#7B1E2B] text-[#F7F0E5] shadow-xs"
                        : "bg-white/80 text-[#32171D] border border-[#C49A6C]/30 hover:bg-[#faeee0]"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowTutorial(true);
                }}
                className="col-span-2 flex items-center justify-center rounded-full px-3 py-2 text-xs font-bold bg-white/80 text-[#32171D] border border-[#C49A6C]/30 hover:bg-[#faeee0] transition cursor-pointer"
              >
                How to Play
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Tutorial / How to Play Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}
