"use client";

import React, { useState } from "react";
import { Share2, Check, AlertCircle } from "lucide-react";
import { shareResult, type ShareResultOptions } from "../utils/share-result";

export interface ShareButtonProps {
  readonly options: ShareResultOptions;
  readonly className?: string;
}

export function ShareButton({ options, className }: ShareButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sharing, setSharing] = useState<boolean>(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    setErrorMsg(null);

    const outcome = await shareResult(options);
    setSharing(false);

    if (outcome.success) {
      if (outcome.method === "clipboard") {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } else if (outcome.error) {
      setErrorMsg(outcome.error);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        data-testid="share-result-button"
        aria-label={copied ? "Copied results to clipboard" : "Share results"}
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
        }
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4 text-coral-500" aria-hidden="true" />
            <span>Share Result</span>
          </>
        )}
      </button>

      {errorMsg && (
        <span
          role="status"
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-coral-600 flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3" />
          {errorMsg}
        </span>
      )}
    </div>
  );
}
