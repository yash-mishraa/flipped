"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Calendar, Compass, BarChart2, BookOpen, Archive } from "lucide-react";
import { TutorialModal } from "@/features/game/components/TutorialModal";

export function Header(): React.JSX.Element {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const navLinks = [
    { href: "/daily", label: "Daily Challenge", icon: Calendar },
    { href: "/classic", label: "Classic Practice", icon: Compass },
    { href: "/archive", label: "Archive", icon: Archive },
    { href: "/stats", label: "Statistics", icon: BarChart2 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/90 bg-[#fcfbf9]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 rounded-lg"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral-500 font-black text-white text-base shadow-xs group-hover:bg-coral-600 transition">
                F
              </div>
              <span className="font-extrabold text-xl tracking-tight text-stone-900 group-hover:text-coral-600 transition">
                FLIPPED
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 ${
                    isActive
                      ? "bg-coral-50 text-coral-700 border border-coral-200"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500"
            >
              <BookOpen className="h-3.5 w-3.5 text-coral-500" aria-hidden="true" />
              <span>How to Play</span>
            </button>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              aria-label="How to play instructions"
              className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500"
            >
              <BookOpen className="h-5 w-5 text-coral-500" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-stone-200/80 bg-[#fcfbf9] px-4 py-3 md:hidden space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-coral-50 text-coral-700 border border-coral-200"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <Icon className="h-4 w-4 text-coral-500" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Global Interactive Tutorial Modal */}
      <TutorialModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </>
  );
}
