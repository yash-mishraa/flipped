"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Compass, Archive, BarChart2, BookOpen, Menu, X } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { TutorialModal } from "@/features/game/components/TutorialModal";

const navLinks = [
  { href: "/daily", label: "Daily", icon: Calendar },
  { href: "/classic", label: "Classic", icon: Compass },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/stats", label: "Statistics", icon: BarChart2 },
] as const;

export function Header(): React.JSX.Element {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#C49A6C]/25 bg-[#F7F0E5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3.5 py-2.5 sm:px-6">
          {/* Brand Logo Lockup */}
          <Link
            href="/"
            className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] rounded-lg"
            aria-label="FLIPPED Home"
          >
            <FlippedSymbol size={20} variant="crimson" />
            <span className="font-extrabold text-lg tracking-tight text-[#32171D] group-hover:text-[#7B1E2B] transition">
              FLIPPED
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2" aria-label="Main Navigation">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#7B1E2B] text-[#F7F0E5]"
                      : "text-[#6B4E55] hover:bg-[#faeee0] hover:text-[#32171D]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#6B4E55] hover:bg-[#faeee0] hover:text-[#32171D] transition cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#7B1E2B]" aria-hidden="true" />
              <span>How to Play</span>
            </button>
          </nav>

          {/* Right Action: Auth + Mobile Hamburger Button */}
          <div className="flex shrink-0 items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl border border-[#C49A6C]/70 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#32171D] shadow-xs hover:bg-[#faeee0] hover:border-[#7B1E2B] transition active:scale-95 cursor-pointer"
                >
                  Sign In
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 border border-[#C49A6C]",
                  },
                }}
              />
            </Show>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl border border-[#C49A6C]/50 bg-white/80 text-[#32171D] hover:bg-[#faeee0] transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#C49A6C]/25 bg-[#F7F0E5] px-4 py-3 shadow-md">
            <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#7B1E2B] text-[#F7F0E5]"
                        : "text-[#32171D] hover:bg-[#faeee0]"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-[#7B1E2B]" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowTutorial(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-[#32171D] hover:bg-[#faeee0] transition cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-[#7B1E2B]" aria-hidden="true" />
                <span>How to Play</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Tutorial / How to Play Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}
