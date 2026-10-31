"use client";

import Link from "next/link";
import { useState } from "react";
import { lessonKey, lessonOrderForLevel, unitsForLevel } from "@/lib/content";
import { duePhraseIds, liveStreak, useHydrated, useProgress } from "@/lib/progress";
import { LevelMeter } from "./LevelMeter";
import { NeelaSays } from "./Neela";
import { Onboarding } from "./Onboarding";
import { SpeakerButton } from "./SpeakerButton";

const TIPS = [
  "Tip: end a request with kodi (ಕೊಡಿ) and it becomes a polite \"please give\".",
  "Tip: swalpa (ಸ್ವಲ್ಪ) means \"a little\". It softens almost any request.",
  "Tip: spelling is flexible when you type. Both neevu and nivu count.",
  "Tip: haaki (ಹಾಕಿ) means \"put\". You will hear it in meter haaki.",
  "Tip: phrases you miss come back for review, so mistakes help you remember.",
];

function greeting(streak: number, due: number, name: string): string {
  const hello = name ? `Namaskara, ${name}!` : "Namaskara!";
  if (due >= 3) return `${hello} ${due} phrases are ready for a quick review.`;
  if (streak >= 2) return `${hello} ${streak} days in a row. Neela is proud of you!`;
  return `${hello} Tap me for a tip.`;
}

const OFFSETS = ["translate-x-0", "translate-x-10", "translate-x-0", "-translate-x-10"];

export function HomePath() {
  const p = useProgress();
  const hydrated = useHydrated();
  const completed = hydrated ? p.completed : {};
  const due = hydrated ? duePhraseIds(p).length : 0;

  const [tipIndex, setTipIndex] = useState(-1);
  const [hopKey, setHopKey] = useState(0);
  const streak = hydrated ? liveStreak(p) : 0;
  const level = hydrated ? p.level : null;
  const levelUnits = level ? unitsForLevel(level) : [];

  // The first lesson you have not finished in this level is where you are now; the rest of the level is locked
  const currentKey = level ? lessonOrderForLevel(level).find((k) => !completed[k]) : undefined;

  if (hydrated && !level) return <Onboarding />;

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl bg-arishina px-6 py-8 text-[#1c1b3a] sm:px-10">
        <p className="text-lg font-semibold">Start with the word you will say most</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="kn text-6xl font-bold leading-tight sm:text-8xl">ನಮಸ್ಕಾರ</p>
          <div className="flex items-center gap-3">
            <SpeakerButton phraseId="g-namaskara" kn="ನಮಸ್ಕಾರ" label="Hear namaskara" variant="ink" />
            <div>
              <p className="text-2xl font-bold">namaskara</p>
              <p className="text-base">Hello</p>
            </div>
          </div>
        </div>
      </section>

      <div key={hopKey}>
        <NeelaSays
          mood={tipIndex >= 0 ? "happy" : "idle"}
          onClick={() => {
            setTipIndex((i) => (i + 1) % TIPS.length);
            setHopKey((k) => k + 1);
          }}
        >
          {tipIndex >= 0 ? TIPS[tipIndex] : greeting(streak, due, hydrated ? p.name : "")}
        </NeelaSays>
      </div>

      {level && <LevelMeter />}

      <Link
        href="/talk"
        className="press flex items-center justify-between gap-4 rounded-2xl border-2 border-kumkuma bg-kumkuma-wash px-5 py-4 shadow-[0_4px_0_0_var(--kumkuma)]"
      >
        <span>
          <span className="block text-xl font-bold">Talk with Neela</span>
          <span className="block text-base text-ink-soft">Speak Kannada and get word-by-word pronunciation tips</span>
        </span>
        <span className="text-3xl" aria-hidden="true">
          🎤
        </span>
      </Link>

      <Link
        href="/games"
        className="press flex items-center justify-between gap-4 rounded-2xl border-2 border-arishina-deep bg-arishina-wash px-5 py-4 shadow-[0_4px_0_0_var(--arishina-deep)]"
      >
        <span>
          <span className="block text-xl font-bold">Play games</span>
          <span className="block text-base text-ink-soft">5 quick games and story quests</span>
        </span>
        <span className="text-3xl" aria-hidden="true">
          🎮
        </span>
      </Link>

      <Link
        href="/account"
        className="press flex items-center justify-between gap-4 rounded-2xl border-2 border-line bg-paper px-5 py-4 shadow-[0_4px_0_0_var(--line)] hover:border-arishina-deep"
      >
        <span>
          <span className="block text-xl font-bold">Account & Test Login</span>
          <span className="block text-base text-ink-soft">Sign in with 1-click test credentials or create an account</span>
        </span>
        <span className="text-3xl" aria-hidden="true">
          👤
        </span>
      </Link>

      {due >= 3 && (
        <Link
          href="/review"
          className="press flex items-center justify-between gap-4 rounded-2xl border-2 border-kumkuma bg-kumkuma-wash px-5 py-4 shadow-[0_4px_0_0_var(--kumkuma)]"
        >
          <span>
            <span className="block text-xl font-bold">Review time</span>
            <span className="block text-base text-ink-soft">{due} phrases are ready to practise again</span>
          </span>
          <span className="rounded-xl bg-kumkuma px-4 py-2 text-base font-bold text-white">Start</span>
        </Link>
      )}

      {!hydrated && <div className="min-h-64" aria-busy="true" />}

      {levelUnits.map((unit) => {
        const isYellow = unit.accent === "yellow";
        return (
          <section key={unit.id} aria-labelledby={`unit-${unit.id}`} className="flex flex-col gap-6">
            <div
              className={`rounded-2xl px-5 py-4 ${isYellow ? "bg-arishina-wash" : "bg-kumkuma-wash"}`}
            >
              <h2 id={`unit-${unit.id}`} className="text-2xl font-bold">
                {unit.title}
              </h2>
              <p className="text-base text-ink-soft">{unit.subtitle}</p>
            </div>

            <ol className="flex flex-col items-center gap-6">
              {unit.lessons.map((lesson, i) => {
                const key = lessonKey(unit.id, lesson.id);
                const isDone = Boolean(completed[key]);
                const isCurrent = key === currentKey;
                const locked = !isDone && !isCurrent;
                const ring = isYellow ? "bg-arishina shadow-[0_6px_0_0_var(--arishina-deep)]" : "bg-kumkuma shadow-[0_6px_0_0_var(--kumkuma-deep)]";
                const ink = isYellow ? "text-[#1c1b3a]" : "text-white";

                const node = (
                  <span
                    className={`press grid h-20 w-20 place-items-center rounded-full text-3xl font-extrabold ${
                      locked ? "bg-line text-ink-soft shadow-[0_6px_0_0_var(--line)]" : `${ring} ${ink}`
                    }`}
                  >
                    {isDone ? "✓" : locked ? "🔒" : "★"}
                  </span>
                );

                return (
                  <li key={key} className={`flex flex-col items-center gap-2 text-center ${OFFSETS[i % OFFSETS.length]}`}>
                    {isCurrent && (
                      <span className="rounded-lg bg-ink px-3 py-1 text-sm font-bold text-paper">Start here</span>
                    )}
                    {locked ? (
                      <span aria-disabled="true" className="cursor-not-allowed" title="Finish the earlier lessons first">
                        {node}
                      </span>
                    ) : (
                      <Link href={`/lesson/${unit.id}/${lesson.id}`} aria-label={`${lesson.title}${isDone ? ", finished" : ""}`}>
                        {node}
                      </Link>
                    )}
                    <span className="text-lg font-bold">{lesson.title}</span>
                    <span className="max-w-48 text-sm text-ink-soft">{lesson.blurb}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

