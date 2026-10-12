import React from "react";
import Link from "next/link";
import { Sparkles, Terminal, ShieldCheck, Play } from "lucide-react";
import { ModeCard } from "@/components/ModeCard";
import { APP_CONFIG, GAME_MODES } from "@/features/game";

export default function HomePage(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-between px-6 py-12 md:px-12 md:py-16">
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-coral-200 bg-coral-50 px-3.5 py-1 text-xs font-semibold text-coral-600">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Stage 4 Timed Gameplay Loop Active</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 md:text-5xl">
          {APP_CONFIG.name}
        </h1>

        <p className="mx-auto max-w-xl text-base text-stone-600 md:text-lg">{APP_CONFIG.tagline}</p>

        <div className="pt-2">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-coral-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
          >
            <Play className="h-4 w-4 fill-white" aria-hidden="true" />
            <span>Launch 60-Second Timed Round</span>
          </Link>
        </div>
      </header>

      <section className="my-10 space-y-6" aria-label="Game Modes Overview">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {GAME_MODES.map((modeInfo) => (
            <ModeCard key={modeInfo.mode} modeInfo={modeInfo} />
          ))}
        </div>

        <div className="rounded-xl border border-stone-200 bg-white/60 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Terminal className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" aria-hidden="true" />
            <div className="space-y-1 text-sm text-stone-600">
              <p className="font-semibold text-stone-900">
                Development Notice — Gameplay Mechanics Pending
              </p>
              <p>
                This minimal application shell verifies that runtime tooling, strict TypeScript
                configuration, Tailwind styling, and automated test pipelines are healthy. The
                playable letter grid with automatic answer detection will be implemented in Stage 2
                and Stage 3.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200/80 pt-6 text-center text-xs text-stone-500">
        <div className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="h-4 w-4 text-stone-400" aria-hidden="true" />
          <span>Production-grade foundation • Strict TypeScript • Vitest suite verified</span>
        </div>
      </footer>
    </main>
  );
}
