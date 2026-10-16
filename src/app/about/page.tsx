import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";

export const metadata: Metadata = {
  title: "About FLIPPED — Origins, Inspiration & How It Works",
  description:
    "Learn about the origins of FLIPPED. Inspired by Times of India's newspaper puzzle, reimagined as a free digital word deduction game with Classic and Daily modes.",
  alternates: {
    canonical: "https://www.flipped.website/about",
  },
  openGraph: {
    title: "About FLIPPED — Origins, Inspiration & How It Works",
    description:
      "Inspired by Times of India's physical print puzzle, reimagined as a free digital word deduction game with Classic and Daily modes on flipped.website.",
    url: "https://www.flipped.website/about",
  },
};

export default function AboutPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />

      <main className="mx-auto flex flex-1 w-full max-w-3xl flex-col items-center px-4 py-8 sm:py-12">
        {/* Hero Lockup */}
        <div className="text-center space-y-3 mb-10 max-w-xl">
          <div className="flex justify-center mb-1">
            <FlippedSymbol size={52} variant="crimson" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#32171D]">
            About FLIPPED
          </h1>
          <p className="text-base sm:text-lg text-[#6B4E55] leading-relaxed">
            The story behind the fast-paced, 60-second word deduction puzzle designed for thinkers and vocabulary lovers.
          </p>
        </div>

        {/* Core Attribution & Inspiration Section */}
        <section
          aria-label="Origins & Inspiration"
          className="w-full rounded-3xl border-2 border-[#C49A6C]/70 bg-white/95 p-6 sm:p-8 shadow-xl shadow-[#32171D]/10 backdrop-blur-md mb-8"
        >
          <div className="text-xs font-black uppercase tracking-wider text-[#7B1E2B] mb-3">
            Origins &amp; Inspiration
          </div>

          <h2 className="text-2xl font-black text-[#32171D] tracking-tight">
            Inspired by Times of India&rsquo;s &ldquo;Flipped It&rdquo;
          </h2>

          <div className="mt-4 space-y-4 text-sm sm:text-base text-[#6B4E55] leading-relaxed">
            <p>
              FLIPPED was inspired by the brilliant word game originally published in the print edition of the <strong className="text-[#32171D]">Times of India</strong> newspaper as &ldquo;Flipped It&rdquo;.
            </p>
            <p>
              While the core concept—flipping the opposite meanings of two clue words to reveal a common phrase—was utterly captivating, it was historically restricted strictly to readers with physical newspaper subscriptions delivered to their doorstep. There was no digital web version, no interactive countdown timer, no automated feedback, and no way for people around the world to practice.
            </p>
            <p>
              We loved the game so much that we decided to liberate it from physical print constraints and reimagine it as a <strong className="text-[#32171D]">modern, 100% free digital web experience</strong> at <span className="font-semibold text-[#7B1E2B]">flipped.website</span>.
            </p>
          </div>

          {/* Key Enhancements Over Original Newspaper Edition */}
          <div className="mt-6 rounded-2xl border border-[#C49A6C]/50 bg-[#faeee0]/70 p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#7B1E2B] mb-3">
              What We Added &amp; Reimagined:
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[#32171D]">
              <li className="rounded-xl border border-[#C49A6C]/30 bg-white/70 p-3">
                <span className="block font-bold text-[#7B1E2B] mb-0.5">100% Free Worldwide Access</span>
                <span className="text-[#6B4E55]">No newspaper subscription or paywall required.</span>
              </li>
              <li className="rounded-xl border border-[#C49A6C]/30 bg-white/70 p-3">
                <span className="block font-bold text-[#7B1E2B] mb-0.5">Classic Practice Mode</span>
                <span className="text-[#6B4E55]">Unlimited randomized sprint rounds across Easy, Medium, and Hard.</span>
              </li>
              <li className="rounded-xl border border-[#C49A6C]/30 bg-white/70 p-3">
                <span className="block font-bold text-[#7B1E2B] mb-0.5">60-Second Real-Time Clock</span>
                <span className="text-[#6B4E55]">High-stakes countdown with penalty-based reveal hints.</span>
              </li>
              <li className="rounded-xl border border-[#C49A6C]/30 bg-white/70 p-3">
                <span className="block font-bold text-[#7B1E2B] mb-0.5">UTC Midnight Reset</span>
                <span className="text-[#6B4E55]">Every player globally gets the identical daily challenge simultaneously.</span>
              </li>
              <li className="rounded-xl border border-[#C49A6C]/30 bg-white/70 p-3">
                <span className="block font-bold text-[#7B1E2B] mb-0.5">Cloud &amp; Guest Streaks</span>
                <span className="text-[#6B4E55]">Play as a guest with local browser streaks or sync across devices with an account.</span>
              </li>
              <li className="rounded-xl border border-[#C49A6C]/30 bg-white/70 p-3">
                <span className="block font-bold text-[#7B1E2B] mb-0.5">Full Historical Archive</span>
                <span className="text-[#6B4E55]">Replay past daily challenges at any time at your own pace.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          aria-label="Game Rules & Mechanism"
          className="w-full rounded-3xl border border-[#C49A6C]/50 bg-white/80 p-6 sm:p-8 shadow-md mb-8"
        >
          <h2 className="text-xl sm:text-2xl font-black text-[#32171D] tracking-tight mb-3">
            How the Deduction Works
          </h2>
          <p className="text-sm text-[#6B4E55] leading-relaxed mb-4">
            In FLIPPED, you are given two clue words. Your mission is to &ldquo;flip&rdquo; each clue word into its opposite or semantic antonym to form a well-known English phrase:
          </p>

          <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/50 p-4 space-y-2 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-[#C49A6C]/20 pb-2">
              <span className="text-[#8C6870] font-semibold">Clue Given:</span>
              <span className="font-mono font-bold text-[#32171D]">&ldquo;SWEET LIE&rdquo;</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-[#C49A6C]/20 pb-2">
              <span className="text-[#8C6870] font-semibold">The Flip:</span>
              <span className="text-[#7B1E2B] font-semibold">SWEET &rarr; BITTER &nbsp;&bull;&nbsp; LIE &rarr; TRUTH</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <span className="text-[#8C6870] font-semibold">Target Phrase:</span>
              <span className="font-mono font-black text-[#7B1E2B] text-sm sm:text-base">BITTER TRUTH</span>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-[#6B4E55] leading-relaxed">
            The first letter of each word is locked as a starting anchor. You type the remaining letters directly into the grid before your 60-second timer expires.
          </p>
        </section>

        {/* Creator & Contact Callout */}
        <section
          aria-label="Creator Contact"
          className="w-full text-center space-y-3 rounded-3xl border border-[#C49A6C]/40 bg-[#faeee0]/40 p-6"
        >
          <h2 className="text-base font-black uppercase tracking-wider text-[#32171D]">
            Crafted by Yash Mishra
          </h2>
          <p className="text-xs sm:text-sm text-[#6B4E55] max-w-md mx-auto">
            FLIPPED is an independent passion project. If you have feedback, ideas for new flipped pairs, or questions, please don&rsquo;t hesitate to reach out.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-[#7B1E2B] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#F7F0E5] shadow-xs hover:bg-[#631722] active:scale-95 transition"
            >
              <span>Open Mailbox</span>
            </Link>
            <Link
              href="/daily"
              className="inline-flex items-center gap-2 rounded-full border border-[#C49A6C] bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-[#32171D] shadow-2xs hover:bg-[#faeee0] active:scale-95 transition"
            >
              <span>Play Today&rsquo;s Challenge</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
