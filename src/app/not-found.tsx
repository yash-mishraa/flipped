import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { Home, Play, Calendar, HelpCircle, Compass } from "lucide-react";

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]" data-testid="not-found-page">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-xl flex-col items-center justify-center px-4 py-8 sm:py-12 text-center">
        <div className="w-full rounded-3xl border border-[#C49A6C]/50 bg-white/95 p-6 sm:p-10 shadow-lg space-y-5 backdrop-blur-sm">
          <div className="mx-auto flex justify-center">
            <FlippedSymbol size={52} variant="crimson" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#faeee0] border border-[#C49A6C] px-3.5 py-1 text-xs font-bold text-[#7B1E2B] uppercase tracking-wider">
            <Compass className="h-3.5 w-3.5" />
            <span>404 &bull; Page Not Found</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#32171D] tracking-tight">
            Phrase Unflipped
          </h1>

          <p className="text-xs sm:text-sm text-[#6B4E55] leading-relaxed max-w-md mx-auto">
            The page you are looking for does not exist or may have moved. Choose a route below to jump straight back into the action!
          </p>

          {/* Quick Navigation Cards */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto text-left">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/50 p-3 hover:bg-[#faeee0] hover:border-[#7B1E2B] transition-all group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#C49A6C]/50 text-[#7B1E2B] shadow-2xs group-hover:scale-105 transition-transform">
                <Home className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[#32171D] group-hover:text-[#7B1E2B]">
                  Home Lobby
                </span>
                <span className="block text-[10px] text-[#6B4E55] truncate">
                  Streaks &amp; Quick Play
                </span>
              </div>
            </Link>

            <Link
              href="/daily"
              className="flex items-center gap-3 rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/50 p-3 hover:bg-[#faeee0] hover:border-[#7B1E2B] transition-all group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#C49A6C]/50 text-[#7B1E2B] shadow-2xs group-hover:scale-105 transition-transform">
                <Play className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[#32171D] group-hover:text-[#7B1E2B]">
                  Daily Challenge
                </span>
                <span className="block text-[10px] text-[#6B4E55] truncate">
                  Today&apos;s 60s Sprint
                </span>
              </div>
            </Link>

            <Link
              href="/classic"
              className="flex items-center gap-3 rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/50 p-3 hover:bg-[#faeee0] hover:border-[#7B1E2B] transition-all group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#C49A6C]/50 text-[#7B1E2B] shadow-2xs group-hover:scale-105 transition-transform">
                <Play className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[#32171D] group-hover:text-[#7B1E2B]">
                  Classic Mode
                </span>
                <span className="block text-[10px] text-[#6B4E55] truncate">
                  Unlimited Practice
                </span>
              </div>
            </Link>

            <Link
              href="/archive"
              className="flex items-center gap-3 rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/50 p-3 hover:bg-[#faeee0] hover:border-[#7B1E2B] transition-all group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#C49A6C]/50 text-[#7B1E2B] shadow-2xs group-hover:scale-105 transition-transform">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[#32171D] group-hover:text-[#7B1E2B]">
                  Past Archives
                </span>
                <span className="block text-[10px] text-[#6B4E55] truncate">
                  Play Previous Days
                </span>
              </div>
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-[#7B1E2B] px-6 py-2.5 text-xs sm:text-sm font-bold text-[#F7F0E5] shadow-md hover:bg-[#631722] active:scale-95 transition"
            >
              Return Home
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#C49A6C] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-95 transition"
            >
              <HelpCircle className="h-3.5 w-3.5 text-[#8C6870]" />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
