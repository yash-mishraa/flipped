import React from "react";
import { Calendar, Compass, CheckCircle2 } from "lucide-react";
import type { ModeDescription } from "@/types";

interface ModeCardProps {
  readonly modeInfo: ModeDescription;
}

export function ModeCard({ modeInfo }: ModeCardProps): React.JSX.Element {
  const Icon = modeInfo.mode === "daily" ? Calendar : Compass;

  return (
    <article className="flex flex-col justify-between rounded-xl border border-stone-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-coral-50 text-coral-600">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-coral-600">
                {modeInfo.badge}
              </span>
              <h3 className="text-xl font-bold tracking-tight text-stone-900">{modeInfo.title}</h3>
            </div>
          </div>
          <span
            className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
            title="Scheduled for implementation in future stages"
          >
            Stage: Planned
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-stone-600">{modeInfo.description}</p>

        <div className="mt-5 border-t border-stone-100 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Planned Mechanics
          </h4>
          <ul className="mt-2.5 space-y-2 text-sm text-stone-700">
            {modeInfo.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-coral-500/80" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-stone-50/80 p-3 text-center text-xs text-stone-500">
        Informational card • Engine implementation begins in Stage 2
      </div>
    </article>
  );
}
