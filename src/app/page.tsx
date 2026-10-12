import React from "react";
import Link from "next/link";
import { Sparkles, Calendar, BookOpen, ShieldCheck, Compass } from "lucide-react";
import { ModeCard } from "@/components/ModeCard";
import { APP_CONFIG, GAME_MODES } from "@/features/game";

export default function HomePage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-between px-6 py-12 md:px-12 md:py-16">
      {/* Brand & Hero Header */}
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-coral-200 bg-coral-50 px-3.5 py-1 text-xs font-semibold text-coral-600">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Stage 5 • Daily & Classic Game Modes Active</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 md:text-5xl">
          {APP_CONFIG.name}
        </h1>

        <p className="mx-auto max-w-xl text-base text-stone-600 md:text-lg">{APP_CONFIG.tagline}</p>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/daily"
            className="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-coral-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>Play Daily Challenge</span>
          </Link>

          <Link
            href="/classic"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-bold text-stone-700 shadow-sm transition-all hover:bg-stone-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
          >
            <Compass className="h-4 w-4 text-stone-500" aria-hidden="true" />
            <span>Play Classic Mode</span>
          </Link>
        </div>
      </header>

      {/* Mode Selection Cards */}
      <section className="my-10 space-y-6" aria-label="Game Modes Overview">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {GAME_MODES.map((modeInfo) => (
            <ModeCard key={modeInfo.mode} modeInfo={modeInfo} />
          ))}
        </div>

        {/* How to Play Card */}
        <div className="rounded-2xl border border-stone-200 bg-white/70 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-3 text-sm text-stone-600">
              <h3 className="font-bold text-stone-900 text-base">How Flipped Works</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
                  <span className="font-bold text-stone-800 text-xs">1. Two Clues</span>
                  <p className="mt-1 text-xs text-stone-600">
                    You receive two clue words that hint at a well-known two-word phrase.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
                  <span className="font-bold text-stone-800 text-xs">2. Semantic Flips</span>
                  <p className="mt-1 text-xs text-stone-600">
                    Each clue transforms through a <strong>SYNONYM</strong> or{" "}
                    <strong>ANTONYM</strong> shift.
                  </p>
                </div>
                <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-3">
                  <span className="font-bold text-stone-800 text-xs">3. 60 Seconds</span>
                  <p className="mt-1 text-xs text-stone-600">
                    Fill in the letter grid before time expires. The first letter of each word is
                    revealed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Archive Quick Bar */}
        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white/60 p-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-5 w-5 text-coral-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-stone-900">Missed a day?</p>
              <p className="text-xs text-stone-500">
                Explore previous daily assignments and review past solutions in the archive.
              </p>
            </div>
          </div>

          <Link
            href="/archive"
            className="rounded-lg border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            Open Archive
          </Link>
        </div>

        {/* Development Notice */}
        <div className="rounded-xl border border-stone-200/90 bg-stone-50/70 p-4 text-xs text-stone-600">
          <p className="font-semibold text-stone-800">
            Development Notice — Gameplay Mechanics Pending
          </p>
          <p className="mt-0.5">
            Stage 5 introduces full client-side Daily scheduling, Classic practice tiers, and local
            progress tracking. Server-side persistence, authentication, and database integration
            will be introduced in Stage 6.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 pt-6 text-center text-xs text-stone-500">
        <div className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="h-4 w-4 text-stone-400" aria-hidden="true" />
          <span>Flipped Puzzle Engine • Deterministic Scheduling • Local Storage Enabled</span>
        </div>
      </footer>
    </main>
  );
}
