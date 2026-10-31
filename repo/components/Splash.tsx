"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Neela } from "./Neela";

type Phase = "show" | "leaving" | "gone";

const SEEN = "kk:splash-seen";
const SHOW_MS = 1600;
const FADE_MS = 350;

let phase: Phase | null = null;
const listeners = new Set<() => void>();

function setPhase(next: Phase) {
  phase = next;
  listeners.forEach((l) => l());
}

function snapshot(): Phase {
  if (phase === null) {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
    } catch {
      // storage blocked: show the splash once per page load
    }
    phase = seen ? "gone" : "show";
  }
  return phase;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** A short welcome shown once per browser session while the app wakes up. */
export function Splash() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "show" as Phase);

  useEffect(() => {
    if (snapshot() !== "show") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => setPhase("leaving"), reduced ? 500 : SHOW_MS);
    const t2 = setTimeout(
      () => {
        setPhase("gone");
        try {
          sessionStorage.setItem(SEEN, "1");
        } catch {
          // ignore
        }
      },
      (reduced ? 500 : SHOW_MS) + FADE_MS,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (state === "gone") return null;
  return (
    <div className={`splash ${state === "leaving" ? "splash-leaving" : ""}`} role="status" aria-label="Loading Kannada Kaliyiri">
      <div className="flex flex-col items-center gap-3 text-center">
        <Neela mood="cheer" size={132} />
        <p className="kn splash-title text-5xl font-extrabold">ಕನ್ನಡ ಕಲಿಯಿರಿ</p>
        <p className="splash-title text-lg font-bold" style={{ animationDelay: "0.35s" }}>
          Kannada Kaliyiri
        </p>
        <div className="splash-dots mt-2 flex gap-2" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
