"use client";

import React, { useState } from "react";
import { Mail, Send, Check, Copy, ExternalLink, Sparkles } from "lucide-react";
import { BorderGlow } from "@/components/ui/BorderGlow";

export interface ContactMailboxProps {
  readonly recipientEmail?: string;
  readonly defaultSubject?: string;
  readonly className?: string;
}

export function ContactMailbox({
  recipientEmail = "flippedbyyash@gmail.com",
  defaultSubject = "FLIPPED Feedback & Reviews",
  className = "",
}: ContactMailboxProps): React.JSX.Element {
  const [copied, setCopied] = useState<boolean>(false);

  const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(
    defaultSubject
  )}`;

  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=${encodeURIComponent(
    defaultSubject
  )}`;

  const handleLaunchMail = () => {
    window.location.href = mailtoUrl;
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(recipientEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <BorderGlow
      data-testid="contact-mailbox"
      edgeSensitivity={30}
      glowColor="350 80 65"
      backgroundColor="#1E0C14"
      borderRadius={28}
      glowRadius={40}
      glowIntensity={1.2}
      coneSpread={25}
      animated={true}
      colors={["#C49A6C", "#E11D48", "#F59E0B"]}
      className={`group mx-auto w-full max-w-xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-[#7B1E2B]/20 active:scale-[0.99] ${className}`}
      onClick={handleLaunchMail}
      role="region"
      aria-label="Contact Developer Mailbox"
    >
      <div className="relative flex flex-col items-center p-6 text-center sm:p-10">
        {/* Glowing Mail Badge */}
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7B1E2B] to-[#B91C1C] text-[#F7F0E5] shadow-lg ring-4 ring-[#C49A6C]/30 transition-transform duration-300 group-hover:scale-105">
          <Mail className="h-8 w-8 text-[#F7F0E5]" />
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F59E0B] text-[#1E0C14] ring-2 ring-[#1E0C14]"
            title="Ready to Send"
          >
            <Sparkles className="h-2.5 w-2.5" />
          </span>
        </div>

        {/* Exact prompt phrase requested */}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#F7F0E5] transition-colors group-hover:text-[#FDE68A]">
          Got any feedback or reviews or need anything then click here
        </h2>

        {/* Direct Email Display */}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C49A6C]">
          <span>Direct email to</span>
          <span className="font-mono font-bold text-[#F7F0E5] underline decoration-[#C49A6C]/60 underline-offset-4">
            {recipientEmail}
          </span>
        </p>

        {/* Action Controls */}
        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={mailtoUrl}
            className="inline-flex items-center gap-2 rounded-full bg-[#7B1E2B] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#F7F0E5] shadow-md transition-all duration-200 hover:bg-[#922434] active:scale-95 ring-1 ring-white/20"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open in Mail App</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Email copied to clipboard" : "Copy email address"}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-[#F7F0E5] backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#C49A6C]" />
                <span>Copy</span>
              </>
            )}
          </button>

          <a
            href={gmailWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-[#F7F0E5] backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-95 cursor-pointer"
          >
            <span>Gmail Web</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#C49A6C]" />
          </a>
        </div>

        {/* Subtext info */}
        <p className="mt-4 text-[11px] text-[#C49A6C]/80">
          Clicking anywhere on the card opens your mail app with a pre-filled draft.
        </p>
      </div>
    </BorderGlow>
  );
}

export default ContactMailbox;
