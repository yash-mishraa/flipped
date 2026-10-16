"use client";

import React, { useState } from "react";
import { Mail, Send, Check, Copy, ExternalLink, Sparkles, MessageSquare } from "lucide-react";

export interface ContactMailboxProps {
  readonly recipientEmail?: string;
  readonly defaultSubject?: string;
  readonly className?: string;
}

export function ContactMailbox({
  recipientEmail = "yashmishra1408@gmail.com",
  defaultSubject = "FLIPPED Player Feedback",
  className = "",
}: ContactMailboxProps): React.JSX.Element {
  const [topic, setTopic] = useState<string>(
    defaultSubject !== "FLIPPED Player Feedback" ? defaultSubject : "Game Feedback & Suggestion"
  );
  const [userNote, setUserNote] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const topics = [
    "Game Feedback & Suggestion",
    "Bug Report / Issue",
    "Puzzle Idea or Flip Clue",
    "Classic / Daily Mode Request",
    "General Hello & Press",
  ];

  const fullSubject = `[FLIPPED] ${topic}`;
  const fullBody = userNote.trim()
    ? `${userNote}\n\n---\nSent via flipped.website`
    : `Hi Yash,\n\nI'm playing FLIPPED (flipped.website) and wanted to reach out regarding: ${topic}.\n\n`;

  const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(
    fullSubject
  )}&body=${encodeURIComponent(fullBody)}`;

  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=${encodeURIComponent(
    fullSubject
  )}&body=${encodeURIComponent(fullBody)}`;

  const handleLaunchMail = () => {
    window.location.href = mailtoUrl;
  };

  const handleCopy = async () => {
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
    <div
      data-testid="contact-mailbox"
      className={`relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl border-2 border-[#C49A6C]/70 bg-white/95 p-6 sm:p-8 shadow-xl shadow-[#32171D]/10 backdrop-blur-md ${className}`}
    >
      {/* Decorative Brand Accent Corner Pill */}
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#faeee0]/60 blur-xl pointer-events-none" />

      {/* Header: Mailbox Icon & Title */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        {/* Animated Mailbox Badge */}
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7B1E2B] to-[#59141F] text-[#F7F0E5] shadow-md ring-4 ring-[#faeee0]">
          <Mail className="h-8 w-8 text-[#F7F0E5]" />
          {/* Mailbox flag accent */}
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C49A6C] text-[#32171D] ring-2 ring-white"
            title="Mailbox Ready"
          >
            <Sparkles className="h-2.5 w-2.5" />
          </span>
        </div>

        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C49A6C]/50 bg-[#faeee0] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#7B1E2B]">
            <MessageSquare className="h-3 w-3" />
            <span>Direct Developer Mailbox</span>
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-[#32171D]">
            Get in Touch
          </h2>
          <p className="text-xs sm:text-sm text-[#6B4E55]">
            Have a suggestion, found a bug, or want to say hi? Drop me a message directly.
          </p>
        </div>
      </div>

      {/* Direct Email Address Display & Copy Button */}
      <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/60 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C6870]">
            Mail To
          </span>
          <span className="block truncate font-mono text-xs sm:text-sm font-bold text-[#7B1E2B]">
            {recipientEmail}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Email copied to clipboard" : "Copy email address"}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#C49A6C]/60 bg-white px-3 py-1.5 text-xs font-bold text-[#32171D] shadow-2xs hover:bg-[#faeee0] active:scale-95 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-[#8C6870]" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Form Controls */}
      <div className="mt-5 space-y-4">
        {/* Topic Selector */}
        <div>
          <label
            htmlFor="mailbox-topic"
            className="block text-xs font-bold uppercase tracking-wider text-[#32171D] mb-1.5"
          >
            Topic
          </label>
          <select
            id="mailbox-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-[#C49A6C]/60 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#32171D] shadow-2xs focus:border-[#7B1E2B] focus:outline-none focus:ring-2 focus:ring-[#7B1E2B]/20 transition"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Message Note (Optional) */}
        <div>
          <label
            htmlFor="mailbox-note"
            className="block text-xs font-bold uppercase tracking-wider text-[#32171D] mb-1.5"
          >
            Your Note <span className="text-[#8C6870] font-normal lowercase">(optional)</span>
          </label>
          <textarea
            id="mailbox-note"
            rows={3}
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder="Type your message here... It will automatically pre-fill your email draft."
            className="w-full resize-none rounded-xl border border-[#C49A6C]/60 bg-white p-3 text-xs sm:text-sm text-[#32171D] placeholder:text-[#8C6870]/70 shadow-2xs focus:border-[#7B1E2B] focus:outline-none focus:ring-2 focus:ring-[#7B1E2B]/20 transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          {/* Primary: Launch Native Mail Client */}
          <button
            type="button"
            onClick={handleLaunchMail}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#7B1E2B] px-5 py-3 text-sm font-bold text-[#F7F0E5] shadow-md transition-all duration-200 ease-out hover:bg-[#631722] hover:shadow-lg active:scale-[0.97] cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Open in Mail App</span>
          </button>

          {/* Secondary: Open in Gmail Web */}
          <a
            href={gmailWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#C49A6C] bg-white px-4 py-3 text-xs sm:text-sm font-bold text-[#32171D] shadow-xs transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97] cursor-pointer"
          >
            <span>Open Gmail Web</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#8C6870]" />
          </a>
        </div>
      </div>

      {/* Response time promise footer */}
      <p className="mt-4 text-center text-[11px] text-[#8C6870]">
        Replies are usually sent within 24–48 hours &bull; Every piece of feedback is read and appreciated.
      </p>
    </div>
  );
}
