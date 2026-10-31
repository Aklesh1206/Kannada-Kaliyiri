"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/types";
import type { ExerciseProps } from "./types";
import { checkTransliteration } from "@/lib/check";
import { SpeakerButton } from "../SpeakerButton";

type Type = Extract<Exercise, { kind: "type" }>;

export function TypeExercise({ phrase, locked, onAnswer }: ExerciseProps<Type>) {
  const [value, setValue] = useState("");

  function change(v: string) {
    setValue(v);
    if (!v.trim()) return onAnswer(null);
    const result = checkTransliteration(v, phrase);
    onAnswer({
      correct: result !== "wrong",
      reveal: result === "exact" ? undefined : phrase.tr,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold sm:text-3xl">Type this in English letters</h2>
        <div className="flex items-center gap-4">
          <SpeakerButton phraseId={phrase.id} kn={phrase.kn} label="Play audio" />
          <div>
            <p className="kn text-4xl font-bold">{phrase.kn}</p>
            <p className="text-lg text-ink-soft">{phrase.en}</p>
          </div>
        </div>
      </div>
      <label className="flex flex-col gap-2">
        <span className="sr-only">Your answer</span>
        <input
          type="text"
          value={value}
          disabled={locked}
          onChange={(e) => change(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Type the Kannada phrase, like namaskara"
          className="w-full rounded-2xl border-2 border-line bg-raised px-4 py-4 text-2xl font-semibold outline-none focus:border-arishina-deep"
        />
        <span className="text-sm text-ink-soft">Spelling does not have to be perfect. Small slips still count.</span>
      </label>
    </div>
  );
}
