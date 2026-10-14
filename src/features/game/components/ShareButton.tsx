"use client";

import React, { useState } from "react";
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
          "inline-flex items-center justify-center rounded-full border border-[#C49A6C] bg-white px-6 py-2.5 text-sm font-semibold text-[#32171D] shadow-xs transition-all duration-200 ease-out hover:bg-[#faeee0] hover:shadow-sm active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] focus-visible:ring-offset-2 cursor-pointer"
        }
      >
        {copied ? (
          <span className="text-[#7B1E2B] font-bold">Copied to Clipboard!</span>
        ) : (
          <span>Share Result</span>
        )}
      </button>

      {errorMsg && (
        <span
          role="status"
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-[#7B1E2B]"
        >
          {errorMsg}
        </span>
      )}
    </div>
  );
}
