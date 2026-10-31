"use client";

import { useEffect, useRef, useState } from "react";
import { LEVELS, lessonOrderForLevel } from "@/lib/content";
import { setLevel, useProgress } from "@/lib/progress";
import type { Level } from "@/lib/types";
import { LevelPills } from "./LevelPills";
import { Neela, NeelaSays } from "./Neela";

const MOVE_MS = 1500;

/**
 * A slim meter across all levels. Neela sits at the tip of the fill, asks how things are going,
 * and pushes the meter forward when the learner moves to another level.
 */
export function LevelMeter() {
  const p = useProgress();
  const level: Level = p.level ?? "beginner";
  const idx = Math.max(0, LEVELS.findIndex((l) => l.id === level));
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];

  const keys = lessonOrderForLevel(level);
  const done = keys.filter((k) => p.completed[k]).length;
  const frac = keys.length ? done / keys.length : 0;
  // Each level starts with a small head start, so moving up always pushes the meter forward
  const pct = ((idx + 0.12 + 0.88 * frac) / LEVELS.length) * 100;

  const [moving, setMoving] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const ready = frac >= 1 && Boolean(next) && !dismissed && !moving;

  function change(to: Level) {
    setDismissed(false);
    if (to === level) return;
    const target = LEVELS.find((l) => l.id === to);
    const up = LEVELS.findIndex((l) => l.id === to) > idx;
    setMoving(up ? `Level up! ${target?.label}` : `Switched to ${target?.label}`);
    setLevel(to);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMoving(null), MOVE_MS + 400);
  }

  // Keep Neela fully on the bar at both ends
  const neelaLeft = Math.min(Math.max(pct, 6), 94);

  return (
    <section aria-label="Your level" className="flex flex-col gap-3 rounded-2xl border-2 border-line bg-raised px-4 pb-4 pt-3">
      <div className="flex items-center justify-between gap-3">
        <span>
          <span className="block text-sm font-semibold text-ink-soft">Your level</span>
          <span className="block text-xl font-extrabold">{current.label}</span>
        </span>
        <span className="text-sm font-semibold text-ink-soft">
          {done}/{keys.length} lessons
        </span>
      </div>

      <div className="relative mt-9">
        <div
          className={`relative h-4 overflow-hidden rounded-full bg-line ${moving ? "meter-push" : ""}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label={`Level progress, ${current.label}`}
        >
          <div className="meter-fill h-full rounded-full bg-arishina" style={{ width: `${pct}%` }} />
          <span aria-hidden="true" className="absolute inset-y-0 left-1/3 w-0.5 bg-paper" />
          <span aria-hidden="true" className="absolute inset-y-0 left-2/3 w-0.5 bg-paper" />
        </div>
        <div className="meter-neela pointer-events-none absolute -top-11" style={{ left: `calc(${neelaLeft}% - 22px)` }}>
          <Neela mood={moving ? "cheer" : ready ? "happy" : "idle"} size={44} />
        </div>
        {moving && (
          <span className="meter-badge absolute -top-9 right-0 rounded-lg bg-ink px-3 py-1 text-sm font-bold text-paper" role="status">
            {moving}
          </span>
        )}
      </div>

      <div className="flex justify-between text-xs font-semibold" aria-hidden="true">
        {LEVELS.map((l, i) => (
          <span key={l.id} className={i <= idx ? "text-ink" : "text-ink-soft"}>
            {l.label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-ink-soft">Neela asks: which level feels right?</p>
        <LevelPills onChange={change} />
      </div>

      {ready && next && (
        <NeelaSays mood="happy" size={56}>
          <span className="block font-bold">You finished every {current.label} lesson!</span>
          <span className="block text-ink-soft">Ready to move up to {next.label}?</span>
          <span className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => change(next.id)}
              className="press rounded-xl bg-arishina px-4 py-2 font-bold text-[#1c1b3a] shadow-[0_3px_0_0_var(--arishina-deep)]"
            >
              Yes, level up
            </button>
            <button type="button" onClick={() => setDismissed(true)} className="rounded-xl px-3 py-2 font-semibold text-ink-soft underline">
              Not yet
            </button>
          </span>
        </NeelaSays>
      )}

    </section>
  );
}
