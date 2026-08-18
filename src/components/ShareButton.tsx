"use client";

import { useState } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import { filtersToSearchParams } from "@/lib/urlState";
import { Fund } from "@/lib/types";

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
      <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
    </svg>
  );
}

export function ShareButton({ selectedFunds }: { selectedFunds: Fund[] }) {
  const filters = useFilterStore();
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    const params = filtersToSearchParams(filters);
    const url = new URL(window.location.href);
    url.search = params.toString();
    return url.toString();
  };

  const handleShare = async () => {
    const url = buildUrl();
    const title =
      selectedFunds.length === 1 ? `${selectedFunds[0].name} — J-Curve Analysis` : "Fund J-Curve Analytics";

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled the native share sheet, or it's unsupported for this context -- fall through
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; nothing more we can do without a backend
    }
  };

  const label =
    selectedFunds.length === 1
      ? `Share ${selectedFunds[0].name}`
      : selectedFunds.length > 1
        ? `Share ${selectedFunds.length} selected funds`
        : "Share this view";

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs rounded-md border border-neutral-700 px-2.5 py-1.5 text-neutral-300 hover:border-teal-400 hover:text-teal-300 transition-colors whitespace-nowrap"
      title="Copy a link that reproduces this exact methodology, fund selection, and filters"
    >
      <ShareIcon />
      {copied ? "Link copied ✓" : label}
    </button>
  );
}
