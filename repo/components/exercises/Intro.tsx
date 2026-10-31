"use client";

import { useEffect } from "react";
import type { Phrase } from "@/lib/types";
import { SpeakerButton } from "../SpeakerButton";

export function Intro({ phrase, onReady }: { phrase: Phrase; onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-lg font-semibold text-ink-soft">New phrase</p>
      <p className="kn text-6xl font-bold leading-tight sm:text-7xl">{phrase.kn}</p>
      <div className="flex items-center gap-4">
        <SpeakerButton phraseId={phrase.id} kn={phrase.kn} size="lg" label={`Play ${phrase.tr}`} />
        <p className="text-4xl font-bold text-kumkuma">{phrase.tr}</p>
      </div>
      <p className="text-2xl font-semibold">{phrase.en}</p>
      {phrase.note && (
        <p className="max-w-md rounded-2xl bg-arishina-wash px-4 py-3 text-base text-ink">{phrase.note}</p>
      )}
      {!phrase.reviewed && (
        <p className="max-w-md text-sm text-ink-soft">
          A Kannada speaker has not checked this phrase yet. Confirm it with a local before you use it.
        </p>
      )}
    </div>
  );
}
