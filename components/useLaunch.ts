"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { TokenStatus } from "@/lib/token";

/**
 * One shared poller for the whole page (hero + footer subscribe to the same
 * state, so there's only ever one request every ~12s).
 */

export type Mode = "auto" | "prelaunch" | "live";
export type View = "checking" | "prelaunch" | "live" | "unknown";

const POLL_MS = 12_000;
const LIVE_KEY = "gtk-live";

type State = { data: TokenStatus | null; failed: boolean; rememberedLive: boolean };

let state: State = { data: null, failed: false, rememberedLive: false };
let seeded = false;
let started = false;
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function start(address: string, firstDelay: number) {
  if (started) return;
  started = true;

  try {
    if (localStorage.getItem(LIVE_KEY) === address) set({ rememberedLive: true });
  } catch {}

  async function tick() {
    if (document.visibilityState === "visible") {
      try {
        const res = await fetch("/api/token", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as TokenStatus;
        set({ data: next, failed: false });
        if (next.status === "live") {
          try {
            localStorage.setItem(LIVE_KEY, address);
          } catch {}
        }
      } catch {
        set({ failed: true }); // keep last known status; market data becomes "unavailable"
      }
    }
    setTimeout(tick, POLL_MS);
  }
  setTimeout(tick, firstDelay);
}

export function useLaunch(initial: TokenStatus | null, mode: Mode, address: string) {
  if (!seeded) {
    state = { ...state, data: initial };
    seeded = true;
  }

  const serverSnap = useMemo<State>(() => ({ data: initial, failed: false, rememberedLive: false }), [initial]);
  const s = useSyncExternalStore(subscribe, () => state, () => serverSnap);

  useEffect(() => {
    // The server-rendered status can be up to ~30s old: refresh shortly after load.
    if (mode === "auto") start(address, initial ? 4_000 : 0);
  }, [mode, address, initial]);

  let view: View;
  if (mode === "live") view = "live";
  else if (mode === "prelaunch") view = "prelaunch";
  else if (s.data?.status === "live" || s.rememberedLive) view = "live";
  else if (!s.data) view = s.failed ? "unknown" : "checking";
  else view = s.data.status;

  const live = view === "live";
  const uncertain = view === "unknown";

  return {
    view,
    market: s.data?.market ?? null,
    marketFailed: s.failed,
    /** Pump.fun page exists (or we can't rule it out). */
    pumpEnabled: live || uncertain,
    /** Dexscreener page resolves (indexed), or we can't rule it out. */
    dexEnabled: uncertain || (live && (s.data?.dexscreenerIndexed ?? mode === "live")),
  };
}
