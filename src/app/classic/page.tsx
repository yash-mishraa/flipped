"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClassicSprintBoard } from "@/features/game/components/ClassicSprintBoard";

export default function ClassicPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E5]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col justify-between px-4 py-8 sm:px-8 sm:py-12">
        {/* Navigation and Top Bar */}
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="flex w-full items-center justify-between border-b border-[#C49A6C]/40 pb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C49A6C]/50 bg-[#faeee0]/70 px-3 py-1.5 text-xs font-semibold text-[#32171D] shadow-sm transition hover:bg-[#faeee0] active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Home</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C49A6C] bg-[#faeee0] px-3 py-1 text-xs font-semibold text-[#7B1E2B]">
              <Compass className="h-3.5 w-3.5 text-[#7B1E2B]" aria-hidden="true" />
              <span>Classic Sprint • Endless Practice</span>
            </div>

            <Link
              href="/archive"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C49A6C]/50 bg-[#faeee0]/70 px-3 py-1.5 text-xs font-semibold text-[#32171D] shadow-sm transition hover:bg-[#faeee0] active:scale-95"
            >
              <span>Daily Archive</span>
            </Link>
          </div>
        </header>

        {/* Interactive Sprint Board */}
        <section className="my-6 w-full flex-1 flex flex-col justify-center">
          <ClassicSprintBoard />
        </section>

        {/* Footer Notice */}
        <footer className="border-t border-[#C49A6C]/40 pt-4 text-center text-xs text-[#6B4E55]">
          <p>Classic Mode • Timed Sprints • Choose 1, 2, 3, or 5 Minutes</p>
        </footer>
      </main>
      <Footer />
    </div>
  );
}

