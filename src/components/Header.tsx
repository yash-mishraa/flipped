"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BranchedMenu, { type BranchedMenuSection } from "@/components/ui/BranchedMenu";

const navItems = [
  { href: "/daily", label: "Daily" },
  { href: "/classic", label: "Classic" },
  { href: "/archive", label: "Archive" },
  { href: "/stats", label: "Statistics" },
] as const;

const branchedMenuItems: readonly BranchedMenuSection[] = [
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
      { value: "/stats", label: "Player Statistics" },
      { value: "how-to-play", label: "How to Play" },
    ],
  },
];

export function Header(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [showTutorial, setShowTutorial] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#C49A6C]/25 bg-[#F7F0E5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3.5 py-2 sm:px-6">
          {/* Left: Menu Trigger (Opens Drawer from Left to Right) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex items-center gap-2 rounded-full border border-[#C49A6C]/50 bg-[#faeee0] px-3.5 py-1 text-xs font-bold text-[#32171D] shadow-2xs hover:bg-[#faeee0]/80 active:scale-[0.96] transition-all duration-200 ease-out cursor-pointer"
            >
              <span className="flex flex-col gap-0.5" aria-hidden="true">
                <span className="h-0.5 w-3.5 bg-[#7B1E2B] rounded-full" />
                <span className="h-0.5 w-2 bg-[#7B1E2B] rounded-full" />
                <span className="h-0.5 w-3.5 bg-[#7B1E2B] rounded-full" />
              </span>
              <span>Menu</span>
            </button>
          </div>

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

          {/* Right Controls: User Profile + Brand Logo Lockup */}
          <div className="flex shrink-0 items-center gap-2.5">
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 border border-[#C49A6C]",
                  },
                }}
              />
            </Show>

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

        {/* Slide-out Menu Backdrop */}
        <div
          className={`fixed inset-0 z-50 bg-[#32171D]/40 backdrop-blur-xs transition-opacity duration-300 ease-out ${
            menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Slide-out Drawer Panel (placed on left, opening to the right) */}
        <aside
          aria-label="Navigation Menu"
          aria-hidden={!menuOpen}
          className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-[#F7F0E5] border-r border-[#C49A6C]/30 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-[#C49A6C]/20 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <FlippedSymbol size={18} variant="crimson" />
              <span className="text-sm font-extrabold tracking-tight text-[#32171D]">
                Navigation
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-full border border-[#C49A6C]/40 bg-[#faeee0] px-2.5 py-1 text-xs font-bold text-[#32171D] hover:bg-[#faeee0]/80 active:scale-[0.96] transition cursor-pointer"
              aria-label="Close navigation menu"
            >
              Close
            </button>
          </div>

          {/* BranchedMenu Component Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <BranchedMenu
              items={branchedMenuItems}
              defaultOpen={[0, 1]}
              defaultActive={pathname}
              onSelect={handleMenuSelect}
              color="#32171D"
              accentColor="#7B1E2B"
              lineColor="#C49A6C"
              width={240}
              rowHeight={36}
              indent={36}
              trunk={14}
              radius={10}
              lineWidth={1.5}
              fontSize={13}
              drawDuration={350}
              foldDuration={250}
            />
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-[#C49A6C]/20 p-4 bg-[#faeee0]/40">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-1.5"
              >
                <FlippedSymbol size={16} variant="crimson" />
                <span className="text-xs font-black tracking-tight text-[#32171D]">FLIPPED</span>
              </Link>
              <span className="text-[10px] text-[#8C6D68] font-medium">Word Flip Game</span>
            </div>
          </div>
        </aside>
      </header>

      {/* Tutorial / How to Play Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}
