"use client";

import { useState } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import { filtersToSearchParams } from "@/lib/urlState";
import { Fund } from "@/lib/types";

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 14a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 10a5 5 0 0 0-7.07 0L4.1 12.83a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

export function ShareButton({ selectedFunds }: { selectedFunds: Fund[] }) {
  const filters = useFilterStore();
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    const params = filtersToSearchParams(filters, filters.bounds);
    const url = new URL(window.location.href);
    url.search = params.toString();
    return url.toString();
  };

  // Deliberately always copies straight to the clipboard rather than
  // invoking navigator.share(): this button's job is "copy a deep link
  // that reproduces this exact view," a single well-defined action, not
  // "send this content somewhere" -- opening the OS share sheet adds an
  // extra decision for what should be a one-click copy (the pattern
  // GitHub, Figma, and Linear all use for their own link-copy buttons).
  const handleShare = async () => {
    const url = buildUrl();
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
      <LinkIcon />
      {copied ? "Link copied ✓" : label}
    </button>
  );
}
