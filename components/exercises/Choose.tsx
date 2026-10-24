"use client";

import { useEffect, useState } from "react";
import type { Exercise } from "@/lib/types";
import type { ExerciseProps } from "./types";
import { SpeakerButton } from "../SpeakerButton";
import { playPhrase } from "@/lib/audio";

type Choose = Extract<Exercise, { kind: "choose" }>;

const PROMPT: Record<Choose["mode"], string> = {
  "kn-to-en": "What does this mean?",
  "en-to-tr": "How do you say this in Kannada?",
  "listen-to-en": "Listen, then pick the meaning",
};

export function ChooseExercise({ exercise, phrase, locked, onAnswer }: ExerciseProps<Choose>) {
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (exercise.mode === "listen-to-en") playPhrase(phrase.id, phrase.kn);
  }, [exercise.mode, phrase.id, phrase.kn]);

  function pick(id: string) {
    if (locked) return;
    setPicked(id);
    const correct = id === exercise.phraseId;
    const reveal = exercise.mode === "en-to-tr" ? phrase.tr : phrase.en;
    onAnswer({ correct, reveal: correct ? undefined : reveal });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold sm:text-3xl">{PROMPT[exercise.mode]}</h2>
        {exercise.mode === "kn-to-en" && (
          <div className="flex items-center gap-4">
            <SpeakerButton phraseId={phrase.id} kn={phrase.kn} label="Play audio" />
            <div>
              <p className="kn text-4xl font-bold">{phrase.kn}</p>
              <p className="text-lg text-ink-soft">{phrase.tr}</p>
            </div>
          </div>
        )}
        {exercise.mode === "en-to-tr" && <p className="text-3xl font-bold text-kumkuma">{phrase.en}</p>}
        {exercise.mode === "listen-to-en" && (
          <SpeakerButton phraseId={phrase.id} kn={phrase.kn} size="lg" label="Play audio again" />
        )}
      </div>

      <div role="radiogroup" aria-label="Answers" className="grid gap-3 sm:grid-cols-2">
        {exercise.options.map((o, i) => {
          const selected = picked === o.id;
          const isRight = o.id === exercise.phraseId;
          let state = "border-line bg-raised";
          if (selected && !locked) state = "border-arishina-deep bg-arishina-wash";
          if (locked && isRight) state = "border-good bg-good-wash";
          if (locked && selected && !isRight) state = "border-kumkuma bg-kumkuma-wash";
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={locked}
              onClick={() => pick(o.id)}
              className={`press flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-xl font-semibold shadow-[0_3px_0_0_var(--line)] ${state}`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-line text-sm font-bold text-ink-soft">
                {i + 1}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
