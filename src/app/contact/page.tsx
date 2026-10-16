import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactMailbox } from "@/components/ContactMailbox";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { HelpCircle, Sparkles, Bug } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us & Feedback",
  description:
    "Get in touch with the creator of FLIPPED. Send game feedback, report puzzle issues, or submit phrase ideas directly to yashmishra1408@gmail.com.",
  alternates: {
    canonical: "https://flipped.website/contact",
  },
  openGraph: {
    title: "Contact Us & Feedback | FLIPPED",
    description:
      "Get in touch with the creator of FLIPPED. Send game feedback, report puzzle issues, or submit phrase ideas directly to yashmishra1408@gmail.com.",
    url: "https://flipped.website/contact",
  },
};

export default function ContactPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />

      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col items-center px-4 py-8 sm:py-12">
        {/* Page Hero Header */}
        <div className="text-center space-y-2 mb-8 max-w-lg">
          <div className="flex justify-center mb-2">
            <FlippedSymbol size={48} variant="crimson" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#32171D]">
            Contact &amp; Feedback
          </h1>
          <p className="text-sm sm:text-base text-[#6B4E55]">
            FLIPPED is built with love for word puzzle enthusiasts. Your thoughts, feedback, and bug reports help make the game better every day.
          </p>
        </div>

        {/* Interactive Mailbox Component */}
        <ContactMailbox recipientEmail="yashmishra1408@gmail.com" />

        {/* Quick FAQ / Common Inquiries */}
        <section
          aria-label="Frequently Asked Questions"
          className="mt-12 w-full max-w-lg space-y-4"
        >
          <h2 className="text-base font-black uppercase tracking-wider text-[#32171D] text-center">
            Common Inquiries
          </h2>

          <div className="space-y-3">
            <div className="rounded-2xl border border-[#C49A6C]/40 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7B1E2B] uppercase tracking-wider">
                <Bug className="h-3.5 w-3.5" />
                <span>Reporting an Incorrect Answer</span>
              </div>
              <p className="mt-1 text-xs text-[#6B4E55] leading-relaxed">
                Notice an issue with a puzzle or an alternative valid synonym? Please include the puzzle date or clue words in your email so we can review the dictionary validator.
              </p>
            </div>

            <div className="rounded-2xl border border-[#C49A6C]/40 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7B1E2B] uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Suggesting New Phrase Pairs</span>
              </div>
              <p className="mt-1 text-xs text-[#6B4E55] leading-relaxed">
                Have a great 2-word flipped pair in mind? Drop it in the mailbox! If selected, your idea will appear in the Classic rotation or Daily challenges.
              </p>
            </div>

            <div className="rounded-2xl border border-[#C49A6C]/40 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7B1E2B] uppercase tracking-wider">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Account &amp; Daily Streak Questions</span>
              </div>
              <p className="mt-1 text-xs text-[#6B4E55] leading-relaxed">
                Guest streaks remain safely saved in your browser localStorage. When you sign in with a free account, streaks are seamlessly synced to the cloud across devices.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
