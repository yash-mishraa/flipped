"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClassicSprintBoard } from "@/features/game/components/ClassicSprintBoard";

export default function ClassicPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col gap-3 sm:gap-4 px-3.5 py-3 sm:px-8 sm:py-6">
        {/* Navigation Bar */}
        <header className="flex w-full items-center justify-between border-b border-[#C49A6C]/30 pb-2.5 sm:pb-3">
          <Link
            href="/"
            className="rounded-full border border-[#C49A6C]/60 bg-white/90 px-3.5 py-1 text-xs font-semibold text-[#32171D] shadow-xs transition hover:bg-[#faeee0] active:scale-[0.98]"
          >
            Home
          </Link>

          <span className="rounded-full border border-[#C49A6C] bg-[#faeee0] px-4 py-1.5 text-xs font-semibold text-[#7B1E2B]">
            Classic Sprint
          </span>

          <Link
            href="/archive"
            className="rounded-full border border-[#C49A6C]/60 bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#32171D] shadow-xs transition hover:bg-[#faeee0] active:scale-[0.98]"
          >
            Daily Archive
          </Link>
        </header>

        {/* Interactive Sprint Board */}
        <section className="w-full flex-1 flex flex-col">
          <ClassicSprintBoard />
        </section>

        {/* Footer Notice */}
        <footer className="border-t border-[#C49A6C]/30 pt-3 text-center text-xs text-[#6B4E55]">
          <p>Classic Mode • Timed Sprints • Choose 1, 2, 3, or 5 Minutes</p>
        </footer>
      </main>
      <Footer />
    </div>
  );
}
