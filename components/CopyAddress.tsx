"use client";

import { useState } from "react";

/** Small contract-address display with a copy button. */
export default function CopyAddress({
  address,
  truncate = false,
  className = "",
}: {
  address: string;
  truncate?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const shown = truncate ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(address);
      ok = true;
    } catch {
      // Fallback for browsers/contexts without the async clipboard API
      try {
        const ta = document.createElement("textarea");
        ta.value = address;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch {
        ok = false;
      }
    }
    setState(ok ? "copied" : "failed");
    setTimeout(() => setState("idle"), 1800);
  }

  return (
    <div className={`inline-flex max-w-full items-center gap-3 text-[13px] ${className}`}>
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Contract</span>
      <code title={address} className="min-w-0 truncate font-mono text-[12.5px] text-white/80">
        {shown}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy contract address"
        className="shrink-0 rounded-md border border-white/15 px-2 py-1 text-[11px] font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60"
      >
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Contract address copied" : ""}
      </span>
    </div>
  );
}
