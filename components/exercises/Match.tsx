"use client";

import { useMemo, useState } from "react";
import type { Exercise } from "@/lib/types";
import { shuffle } from "@/lib/exercises";
import type { Answer } from "./types";

type Match = Extract<Exercise, { kind: "match" }>;

export function MatchExercise({
  exercise,
  locked,
  onAnswer,
}: {
  exercise: Match;
  locked: boolean;
  onAnswer: (a: Answer | null) => void;
}) {
  const rightColumn = useMemo(() => shuffle(exercise.pairs), [exercise.pairs]);
  const [leftPick, setLeftPick] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);

  function chooseLeft(id: string) {
    if (locked || done.has(id)) return;
    setLeftPick(id);
  }

  function chooseRight(id: string) {
    if (locked || done.has(id) || !leftPick) return;
    if (id === leftPick) {
      const next = new Set(done).add(id);
      setDone(next);
      setLeftPick(null);
      if (next.size === exercise.pairs.length) {
        const results: Record<string, boolean> = {};
        exercise.pairs.forEach((p) => (results[p.id] = !mistakes.has(p.id)));
        onAnswer({ correct: mistakes.size === 0, phraseResults: results });
      }
    } else {
      setMistakes((m) => new Set(m).add(leftPick));
      setFlash(id);
      setLeftPick(null);
      window.setTimeout(() => setFlash(null), 300);
    }
  }

  const base = "press rounded-2xl border-2 px-4 py-4 text-lg font-semibold shadow-[0_3px_0_0_var(--line)]";
  const idle = "border-line bg-raised";

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold sm:text-3xl">Match each phrase to its meaning</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="flex flex-col gap-3">
          {exercise.pairs.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={locked || done.has(p.id)}
              aria-pressed={leftPick === p.id}
              onClick={() => chooseLeft(p.id)}
              className={`${base} ${
                done.has(p.id)
                  ? "border-good bg-good-wash opacity-60"
                  : leftPick === p.id
                    ? "border-arishina-deep bg-arishina-wash"
                    : idle
              }`}
            >
              {p.tr}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {rightColumn.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={locked || done.has(p.id)}
              onClick={() => chooseRight(p.id)}
              className={`${base} ${
                done.has(p.id)
                  ? "border-good bg-good-wash opacity-60"
                  : flash === p.id
                    ? "shake border-kumkuma bg-kumkuma-wash"
                    : idle
              }`}
            >
              {p.en}
            </button>
          ))}
        </div>
      </div>
      <p className="text-base text-ink-soft" aria-live="polite">
        {done.size} of {exercise.pairs.length} matched
      </p>
    </div>
  );
}
