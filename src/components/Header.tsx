"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import BranchedMenu, { type BranchedMenuSection } from "@/components/ui/BranchedMenu";
import { setActiveUser } from "@/features/game/persistence/local-progress";

export function Header(): React.JSX.Element {
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [showTutorial, setShowTutorial] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync active user identity in local progress whenever Clerk auth state changes
  useEffect(() => {
    setActiveUser(isSignedIn && user?.id ? user.id : null);
  }, [isSignedIn, user?.id]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu on Escape key press
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const handleMenuSelect = (value: string) => {
    setMenuOpen(false);
    if (value === "how-to-play") {
      setShowTutorial(true);
    } else {
      router.push(value);
    }
  };

  const menuSections: readonly BranchedMenuSection[] = React.useMemo(
    () => [
      {
        label: "Play",
        children: [
          { value: "/daily", label: "Daily Challenge" },
          { value: "/classic", label: "Classic Sprint" },
          { value: "/archive", label: "Challenge Archive" },
        ],
      },
      {
        label: "Account & Help",
        children: [
          ...(isSignedIn
            ? [{ value: "/stats", label: "Player Statistics" }]
            : [
                { value: "/sign-in", label: "Log In / Sign Up" },
                { value: "/stats", label: "Player Statistics" },
              ]),
          { value: "how-to-play", label: "How to Play" },
          { value: "/contact", label: "Contact Us" },
        ],
      },
      {
        label: "About & Legal",
        children: [
          { value: "/about", label: "About FLIPPED" },
          { value: "/privacy", label: "Privacy Policy" },
          { value: "/terms", label: "Terms of Service" },
        ],
      },
    ],
    [isSignedIn]
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F7F0E5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3.5 py-2 sm:px-6">
          {/* Left: Menu Trigger (Opens Drawer from Left to Right) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex items-center gap-2 rounded-full border border-[#C49A6C]/50 bg-[#faeee0] px-4 py-1.5 min-h-[36px] text-xs font-bold text-[#32171D] shadow-2xs hover:bg-[#faeee0]/80 active:scale-[0.96] transition-all duration-200 ease-out cursor-pointer"
            >
              <span className="flex flex-col gap-0.5" aria-hidden="true">
                <span className="h-0.5 w-3.5 bg-[#7B1E2B] rounded-full" />
                <span className="h-0.5 w-2 bg-[#7B1E2B] rounded-full" />
                <span className="h-0.5 w-3.5 bg-[#7B1E2B] rounded-full" />
              </span>
              <span>Menu</span>
            </button>
          </div>

          {/* Right Controls: User Profile / Log In Pill + Brand Logo Lockup */}
          <div className="flex shrink-0 items-center gap-2.5">
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 border border-[#C49A6C]",
                  },
                }}
              />
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center rounded-full border border-[#C49A6C]/70 bg-white/90 px-3.5 py-1.5 min-h-[36px] text-xs font-bold text-[#7B1E2B] shadow-2xs hover:bg-[#faeee0] active:scale-95 transition-all duration-150"
                aria-label="Log In"
              >
                Log In
              </Link>
            )}

            {/* Brand Logo Lockup on Right */}
            <Link
              href="/"
              className="flex items-center gap-2 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] rounded-lg"
              aria-label="FLIPPED Home"
            >
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#32171D] group-hover:text-[#7B1E2B] transition">
                FLIPPED
              </span>
              <FlippedSymbol size={20} variant="crimson" />
            </Link>
          </div>
        </div>
      </header>

      {/* Slide-out Menu Backdrop (rendered outside header to avoid backdrop-blur clipping) */}
      <div
        className={`fixed inset-0 z-50 bg-[#32171D]/50 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel (full viewport height on mobile, opens left-to-right) */}
      <aside
        aria-label="Navigation Menu"
        aria-hidden={!menuOpen}
        inert={!menuOpen ? true : undefined}
        className={`fixed inset-y-0 left-0 z-50 h-[100dvh] w-80 max-w-[85vw] bg-[#F7F0E5] border-r border-[#C49A6C]/40 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#C49A6C]/25 px-5 py-4 bg-[#faeee0]/50">
          <div className="flex items-center gap-2.5">
            <FlippedSymbol size={22} variant="crimson" />
            <span className="text-base font-extrabold tracking-tight text-[#32171D]">
              Navigation
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="rounded-full border border-[#C49A6C]/50 bg-white px-3.5 py-1.5 text-xs font-bold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.96] transition cursor-pointer"
            aria-label="Close navigation menu"
          >
            Close
          </button>
        </div>

        {/* BranchedMenu Component Body with large readable typography and comfortable tap targets */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <BranchedMenu
            items={menuSections}
            defaultOpen={[0, 1]}
            defaultActive={pathname}
            onSelect={handleMenuSelect}
            color="#32171D"
            accentColor="#7B1E2B"
            lineColor="#C49A6C"
            width={280}
            rowHeight={46}
            indent={44}
            trunk={16}
            radius={12}
            lineWidth={2}
            fontSize={16}
            drawDuration={350}
            foldDuration={260}
          />
        </div>

        {/* Drawer Footer with Quick Mode Action */}
        <div className="border-t border-[#C49A6C]/25 p-5 bg-[#faeee0]/60 space-y-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <FlippedSymbol size={18} variant="crimson" />
              <span className="text-sm font-black tracking-tight text-[#32171D]">FLIPPED</span>
            </Link>
            <span className="text-xs text-[#8C6D68] font-medium">Word Flip Game</span>
          </div>

          <Link
            href="/daily"
            onClick={() => setMenuOpen(false)}
            className="w-full flex items-center justify-center rounded-full bg-[#7B1E2B] py-2.5 text-xs font-bold text-[#F7F0E5] shadow-xs hover:bg-[#631722] active:scale-[0.97] transition-all duration-200 ease-out"
          >
            Play Daily Challenge
          </Link>

          {!isSignedIn && (
            <Link
              href="/sign-in"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center justify-center rounded-full border border-[#C49A6C] bg-white py-2 text-xs font-bold text-[#32171D] shadow-2xs hover:bg-[#faeee0] active:scale-[0.97] transition-all duration-200 ease-out"
            >
              Log In / Create Account
            </Link>
          )}
        </div>
      </aside>

      {/* Tutorial / How to Play Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}
