import React from "react";
import Link from "next/link";
import { Calendar, Compass, CheckCircle2, ArrowRight } from "lucide-react";
import type { ModeDescription } from "@/types";

interface ModeCardProps {
  readonly modeInfo: ModeDescription;
  readonly ctaHref?: string;
  readonly statusLabel?: string;
}

export function ModeCard({ modeInfo, ctaHref, statusLabel }: ModeCardProps): React.JSX.Element {
  const isDaily = modeInfo.mode === "daily";
  const Icon = isDaily ? Calendar : Compass;
  const targetHref = ctaHref ?? (isDaily ? "/daily" : "/classic");
  const ctaText = isDaily ? "Play Daily Challenge" : "Play Classic Mode";

  return (
    <article
      data-testid={`mode-card-${modeInfo.mode}`}
      className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-coral-300 hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-coral-50 text-coral-600 shadow-xs">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-coral-600">
                {modeInfo.badge}
              </span>
              <h3 className="text-xl font-extrabold tracking-tight text-stone-900">
                {modeInfo.title}
              </h3>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            {statusLabel ?? "Active"}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-stone-600">{modeInfo.description}</p>

        <div className="mt-5 border-t border-stone-100 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Key Rules & Mechanics
          </h4>
          <ul className="mt-2.5 space-y-2 text-sm text-stone-700">
            {modeInfo.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-coral-500" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-stone-100">
        <Link
          href={targetHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-coral-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
        >
          <span>{ctaText}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
