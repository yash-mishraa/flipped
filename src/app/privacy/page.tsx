import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "FLIPPED Privacy Policy. Learn how your game progress, guest streaks, and account synchronization data are handled safely and transparently on flipped.website.",
  alternates: {
    canonical: "https://www.flipped.website/privacy",
  },
  openGraph: {
    title: "Privacy Policy | FLIPPED",
    description:
      "Learn how your game progress, guest streaks, and account synchronization data are handled safely and transparently on flipped.website.",
    url: "https://www.flipped.website/privacy",
  },
};

export default function PrivacyPage(): React.JSX.Element {
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
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#8C6870]">
            Effective Date: October 16, 2026 &bull; Domain: flipped.website
          </p>
        </div>

        {/* Content Card */}
        <article className="w-full rounded-3xl border border-[#C49A6C]/50 bg-white/95 p-6 sm:p-10 shadow-lg space-y-6 text-sm text-[#6B4E55] leading-relaxed">
          {/* Summary Box */}
          <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/70 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-[#7B1E2B] mb-1">
              Privacy at a Glance
            </div>
            <p className="text-xs text-[#32171D] leading-relaxed">
              FLIPPED is built with a privacy-first mindset. We do not track you across the web, we do not show third-party behavioral advertisements, and we do not sell your personal information. You can play completely anonymously as a guest without creating an account.
            </p>
          </div>

          {/* Section 1: Information We Collect */}
          <section className="space-y-2">
            <h2 className="text-[#32171D] font-bold text-base sm:text-lg">
              1. Information We Collect &amp; Store
            </h2>
            <p>
              Depending on how you use <strong className="text-[#32171D]">flipped.website</strong>, we collect minimal data required to provide the game:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Guest Mode (No Account):</strong> Your puzzle completion state, solve times, streak counter, and recent Classic game IDs are saved exclusively on your device inside your browser&rsquo;s <code className="font-mono text-xs bg-[#faeee0] px-1 py-0.5 rounded text-[#7B1E2B]">localStorage</code>. No identity information is transmitted to our servers.
              </li>
              <li>
                <strong>Authenticated Accounts:</strong> If you choose to create a free account to sync progress across multiple devices, our authentication provider (<a href="https://clerk.com" target="_blank" rel="noopener noreferrer" className="text-[#7B1E2B] underline font-medium">Clerk</a>) securely manages your credentials (such as email address or Google OAuth ID). We store only your game statistics (games played, win rate, daily streak, and best solve times) linked to your unique user ID.
              </li>
              <li>
                <strong>Technical Diagnostics:</strong> Standard, anonymous HTTP request logs (IP address, browser user-agent, request timestamp) are temporarily maintained by our hosting infrastructure (<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#7B1E2B] underline font-medium">Vercel</a>) strictly for DDOS defense, rate limiting, and server health monitoring.
              </li>
            </ul>
          </section>

          {/* Section 2: How We Use Information */}
          <section className="space-y-2">
            <h2 className="text-[#32171D] font-bold text-base sm:text-lg">
              2. How We Use Your Information
            </h2>
            <p>We use stored data solely for the following operational purposes:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>To evaluate word solutions and track daily single-attempt completion status.</li>
              <li>To compute player win rates, streaks, and solve times on your personal Statistics page.</li>
              <li>To enforce fair rate limiting on puzzle submission endpoints.</li>
              <li>To respond to inquiries and bug reports sent to our developer mailbox.</li>
            </ul>
          </section>

          {/* Section 3: Cookies & Local Storage */}
          <section className="space-y-2">
            <h2 className="text-[#32171D] font-bold text-base sm:text-lg">
              3. Cookies &amp; Local Storage Technology
            </h2>
            <p>
              FLIPPED does not use third-party marketing or advertising tracking cookies. We utilize:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>Essential Local Storage:</strong> Keys such as <code className="font-mono text-xs bg-[#faeee0] px-1 py-0.5 rounded text-[#7B1E2B]">flipped_progress_guest_v1</code> and <code className="font-mono text-xs bg-[#faeee0] px-1 py-0.5 rounded text-[#7B1E2B]">flipped_progress_user_*</code> to preserve your daily streaks and game history without requiring network calls on every reload.
              </li>
              <li>
                <strong>Authentication Session Cookies:</strong> First-party session tokens issued by Clerk when you actively log in, ensuring you remain signed in across page reloads.
              </li>
            </ul>
          </section>

          {/* Section 4: Data Security & Retention */}
          <section className="space-y-2">
            <h2 className="text-[#32171D] font-bold text-base sm:text-lg">
              4. Data Security &amp; Retention
            </h2>
            <p>
              All network traffic to <span className="font-semibold text-[#32171D]">flipped.website</span> is encrypted in transit using industry-standard Transport Layer Security (TLS/HTTPS). User passwords are never handled directly by our application code; authentication tokens are encrypted and managed with SOC-2 compliant infrastructure via Clerk.
            </p>
          </section>

          {/* Section 5: Your Rights */}
          <section className="space-y-2">
            <h2 className="text-[#32171D] font-bold text-base sm:text-lg">
              5. Your Rights &amp; Data Deletion
            </h2>
            <p>
              You maintain total control over your information:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>
                <strong>Clear Local Progress:</strong> You can wipe all local guest game history at any time by clearing your browser cache and localStorage data for <code className="font-mono text-xs bg-[#faeee0] px-1 py-0.5 rounded text-[#7B1E2B]">flipped.website</code>.
              </li>
              <li>
                <strong>Delete Cloud Account:</strong> You may request permanent deletion of your account and associated synchronized statistics by emailing us at <a href="mailto:flippedbyyash@gmail.com" className="text-[#7B1E2B] underline font-medium">flippedbyyash@gmail.com</a>. We will erase all server-side records within 3 business days.
              </li>
            </ul>
          </section>

          {/* Section 6: Contact Information */}
          <section className="space-y-2 border-t border-[#C49A6C]/30 pt-4">
            <h2 className="text-[#32171D] font-bold text-base sm:text-lg">
              6. Contact Us
            </h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please reach out to the developer:
            </p>
            <div className="rounded-xl border border-[#C49A6C]/40 bg-[#faeee0]/50 p-3 text-xs sm:text-sm">
              <p className="font-bold text-[#32171D]">Yash Mishra</p>
              <p>Email: <a href="mailto:flippedbyyash@gmail.com" className="text-[#7B1E2B] underline font-semibold">flippedbyyash@gmail.com</a></p>
              <p>Website: <Link href="/contact" className="text-[#7B1E2B] underline font-semibold">flipped.website/contact</Link></p>
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
