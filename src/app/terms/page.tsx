import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { Scale, FileText, AlertCircle, ShieldAlert, Award, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service & Legal Notices",
  description:
    "Terms of Service for FLIPPED (flipped.website). Read our terms of use, fair play policies, intellectual property notices, and attribution details.",
  alternates: {
    canonical: "https://flipped.website/terms",
  },
  openGraph: {
    title: "Terms of Service & Legal Notices | FLIPPED",
    description:
      "Read our terms of use, fair play policies, intellectual property notices, and attribution details on flipped.website.",
    url: "https://flipped.website/terms",
  },
};

export default function TermsPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />

      <main className="mx-auto flex flex-1 w-full max-w-3xl flex-col px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center mb-1">
            <FlippedSymbol size={44} variant="crimson" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#32171D]">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-[#8C6870]">
            Last Updated: October 16, 2026 &bull; Domain: flipped.website
          </p>
        </div>

        {/* Content Card */}
        <article className="w-full rounded-3xl border border-[#C49A6C]/50 bg-white/95 p-6 sm:p-10 shadow-lg space-y-6 text-sm text-[#6B4E55] leading-relaxed">
          {/* Welcome Notice */}
          <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/70 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7B1E2B] mb-1">
              <FileText className="h-4 w-4" />
              <span>Agreement to Terms</span>
            </div>
            <p className="text-xs text-[#32171D] leading-relaxed">
              By accessing or playing on <strong className="text-[#32171D]">flipped.website</strong> (&ldquo;FLIPPED&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of the website.
            </p>
          </div>

          {/* Section 1: Gameplay & Fair Play */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[#32171D] font-bold text-base sm:text-lg">
              <Scale className="h-4 w-4 text-[#7B1E2B]" />
              <h2>1. Fair Play &amp; Permitted Use</h2>
            </div>
            <p>
              FLIPPED is a free intellectual recreation and deduction puzzle provided for personal entertainment. You agree to use the service in accordance with fair play standards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                You may play Daily Challenges, Classic Sprints, and Archive puzzles using standard web browsers on any device.
              </li>
              <li>
                You agree not to deploy automated bots, scrapers, headless scripts, or reverse-engineering tools to flood server endpoints or artificially manipulate leaderboard rankings.
              </li>
              <li>
                We reserve the right to temporarily rate-limit or block IP addresses that issue anomalous request volumes or exhibit malicious behavior.
              </li>
            </ul>
          </section>

          {/* Section 2: Intellectual Property & Attribution Notice */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[#32171D] font-bold text-base sm:text-lg">
              <Award className="h-4 w-4 text-[#7B1E2B]" />
              <h2>2. Intellectual Property &amp; Inspiration Notice</h2>
            </div>
            <p>
              FLIPPED is an independent digital game developed and maintained by <strong className="text-[#32171D]">Yash Mishra</strong>.
            </p>
            <div className="rounded-xl border border-[#C49A6C]/40 bg-[#faeee0]/50 p-3.5 text-xs text-[#32171D] leading-relaxed">
              <p className="font-bold text-[#7B1E2B] uppercase tracking-wider text-[11px] mb-1">
                Attribution &amp; Source of Inspiration
              </p>
              <p>
                FLIPPED was inspired by the word puzzle titled &ldquo;Flipped It&rdquo; originally featured in the physical print edition of the <strong className="text-[#32171D]">Times of India</strong> newspaper. Because the newspaper game was strictly physical and restricted to print subscribers, FLIPPED was engineered from scratch as an original, free digital software application with unique timer dynamics, Classic Practice modes, interactive feedback, and cloud synchronization.
              </p>
              <p className="mt-1.5 text-[11px] text-[#6B4E55]">
                Times of India is a registered trademark of Bennett, Coleman &amp; Co. Ltd. FLIPPED is an independent non-commercial homage and is not affiliated with, sponsored by, or endorsed by Bennett, Coleman &amp; Co. Ltd.
              </p>
            </div>
            <p className="text-xs sm:text-sm">
              All bespoke code, vector assets, user interface layouts, brand typography, and proprietary software algorithms powering <span className="font-semibold text-[#32171D]">flipped.website</span> are the exclusive intellectual property of the developer.
            </p>
          </section>

          {/* Section 3: Accounts & Security */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[#32171D] font-bold text-base sm:text-lg">
              <ShieldAlert className="h-4 w-4 text-[#7B1E2B]" />
              <h2>3. User Accounts &amp; Data Synchronization</h2>
            </div>
            <p>
              Account creation is entirely optional. When you register an account to sync your game statistics, you are responsible for maintaining the confidentiality of your login credentials. You agree that we may store your solve statistics and streak history in connection with your account ID as outlined in our <Link href="/privacy" className="text-[#7B1E2B] underline font-medium">Privacy Policy</Link>.
            </p>
          </section>

          {/* Section 4: Disclaimer of Warranties */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-[#32171D] font-bold text-base sm:text-lg">
              <AlertCircle className="h-4 w-4 text-[#7B1E2B]" />
              <h2>4. Disclaimer of Warranties</h2>
            </div>
            <p className="text-xs sm:text-sm">
              FLIPPED is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied. While we strive for 100% puzzle accuracy and uninterrupted uptime, we do not warrant that the website will always be error-free or that service will be continuous.
            </p>
          </section>

          {/* Section 5: Contact */}
          <section className="space-y-2 border-t border-[#C49A6C]/30 pt-4">
            <div className="flex items-center gap-2 text-[#32171D] font-bold text-base sm:text-lg">
              <Mail className="h-4 w-4 text-[#7B1E2B]" />
              <h2>5. Inquiries &amp; Legal Notices</h2>
            </div>
            <p>
              For legal inquiries, copyright questions, or licensing discussions, please contact the developer directly:
            </p>
            <div className="rounded-xl border border-[#C49A6C]/40 bg-[#faeee0]/50 p-3 text-xs sm:text-sm">
              <p className="font-bold text-[#32171D]">Yash Mishra</p>
              <p>Email: <a href="mailto:yashmishra1408@gmail.com" className="text-[#7B1E2B] underline font-semibold">yashmishra1408@gmail.com</a></p>
              <p>Online Mailbox: <Link href="/contact" className="text-[#7B1E2B] underline font-semibold">flipped.website/contact</Link></p>
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
