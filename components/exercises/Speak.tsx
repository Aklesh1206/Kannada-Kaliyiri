"use client";

import { useEffect, useRef, useState } from "react";
import type { Phrase } from "@/lib/types";
import type { Answer } from "./types";
import { scoreSpeech, type SpeechVerdict } from "@/lib/check";
import { listenOnce, SpeechError, speechErrorMessage, type SpeechErrorCode } from "@/lib/speech";
import { SpeakerButton } from "../SpeakerButton";

type State =
  | { phase: "idle" }
  | { phase: "listening" }
  | { phase: "result"; verdict: SpeechVerdict; heard: string }
  | { phase: "error"; code: SpeechErrorCode };

const VERDICT_TEXT: Record<SpeechVerdict, string> = {
  great: "Sounds right",
  close: "Almost there",
  retry: "Not quite, try again",
};

export function Speak({ phrase, onAnswer }: { phrase: Phrase; onAnswer: (a: Answer | null) => void }) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const listener = useRef<{ stop: () => void } | null>(null);

  // Speaking is a bonus: the learner can always skip, so the button is ready straight away
  useEffect(() => {
    onAnswer({ correct: true });
    const current = listener;
    return () => current.current?.stop();
  }, [onAnswer]);

  function start() {
    setState({ phase: "listening" });
    const session = listenOnce();
    listener.current = session;
    session.result
      .then((alternatives) => {
        const { verdict, best } = scoreSpeech(alternatives, phrase);
        setState({ phase: "result", verdict, heard: best });
        onAnswer({ correct: true, attempted: true, xp: verdict === "great" ? 3 : 0 });
      })
      .catch((err: unknown) => {
        setState({ phase: "error", code: err instanceof SpeechError ? err.code : "other" });
      });
  }

  const listening = state.phase === "listening";

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-2xl font-bold sm:text-3xl">Say it out loud</h2>
      <div className="flex flex-col items-center gap-3">
        <p className="kn text-5xl font-bold leading-tight sm:text-6xl">{phrase.kn}</p>
        <div className="flex items-center gap-3">
          <SpeakerButton phraseId={phrase.id} kn={phrase.kn} label="Hear it first" />
          <p className="text-3xl font-bold text-kumkuma">{phrase.tr}</p>
        </div>
        <p className="text-xl font-semibold">{phrase.en}</p>
      </div>

      <button
        type="button"
        onClick={start}
        disabled={listening}
        aria-label={listening ? "Listening" : "Start speaking"}
        className={`press grid h-24 w-24 place-items-center rounded-full text-white shadow-[0_5px_0_0_var(--kumkuma-deep)] disabled:cursor-wait ${
          listening ? "bg-kumkuma-deep" : "bg-kumkuma"
        }`}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1A7 7 0 0 0 19 12h-2z"
          />
        </svg>
      </button>

      <div className="min-h-24 max-w-md" aria-live="polite">
        {state.phase === "idle" && <p className="text-ink-soft">Tap the microphone, then say the phrase.</p>}
        {listening && <p className="text-lg font-semibold">Listening…</p>}
        {state.phase === "result" && (
          <div className="flex flex-col gap-1">
            <p className={`text-2xl font-bold ${state.verdict === "great" ? "text-good" : "text-kumkuma"}`}>
              {VERDICT_TEXT[state.verdict]}
            </p>
            <p className="text-ink-soft">
              Heard: <span className="kn font-semibold text-ink">{state.heard || "nothing"}</span>
            </p>
          </div>
        )}
        {state.phase === "error" && <p className="text-lg text-kumkuma">{speechErrorMessage(state.code)}</p>}
      </div>

      <p className="max-w-sm text-sm text-ink-soft">
        Kannada speech recognition is not perfect. Treat this as a guide, not a grade. It never costs a heart.
      </p>
    </div>
  );
}
