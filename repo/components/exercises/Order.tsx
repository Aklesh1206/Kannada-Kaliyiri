"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/types";
import type { ExerciseProps } from "./types";
import { SpeakerButton } from "../SpeakerButton";

type Order = Extract<Exercise, { kind: "order" }>;

export function OrderExercise({ exercise, phrase, locked, onAnswer }: ExerciseProps<Order>) {
  // Placed words are stored as indexes into exercise.tokens so repeated words stay distinct
  const [placed, setPlaced] = useState<number[]>([]);

  function update(next: number[]) {
    setPlaced(next);
    if (next.length === 0) return onAnswer(null);
    if (next.length < exercise.tokens.length) return onAnswer(null);
    const built = next.map((i) => exercise.tokens[i]);
    const correct = built.join(" ") === exercise.answer.join(" ");
    onAnswer({ correct, reveal: correct ? undefined : exercise.answer.join(" ") });
  }

  function add(i: number) {
    if (locked || placed.includes(i)) return;
    update([...placed, i]);
  }

  function remove(i: number) {
    if (locked) return;
    update(placed.filter((x) => x !== i));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold sm:text-3xl">Build this sentence in Kannada</h2>
        <div className="flex items-center gap-4">
          <SpeakerButton phraseId={phrase.id} kn={phrase.kn} label="Play audio" />
          <p className="text-2xl font-semibold text-kumkuma">{phrase.en}</p>
        </div>
      </div>

      <div
        className="flex min-h-20 flex-wrap items-center gap-2 border-b-2 border-line pb-3"
        aria-label="Your sentence"
      >
        {placed.map((i) => (
          <button
            key={i}
            type="button"
            disabled={locked}
            onClick={() => remove(i)}
            className="press rounded-xl border-2 border-line bg-raised px-4 py-3 text-xl font-semibold shadow-[0_3px_0_0_var(--line)]"
          >
            {exercise.tokens[i]}
          </button>
        ))}
        {placed.length === 0 && <span className="text-ink-soft">Tap the words below</span>}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Word bank">
        {exercise.tokens.map((t, i) => (
          <button
            key={i}
            type="button"
            disabled={locked || placed.includes(i)}
            onClick={() => add(i)}
            className={`press rounded-xl border-2 px-4 py-3 text-xl font-semibold shadow-[0_3px_0_0_var(--line)] ${
              placed.includes(i) ? "border-line bg-line/40 text-transparent" : "border-line bg-raised"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
