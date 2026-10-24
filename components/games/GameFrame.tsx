"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { unitsForLevel } from "@/lib/content";
import { pickPool } from "@/lib/games";
import { useHydrated, useProgress } from "@/lib/progress";
import type { Phrase } from "@/lib/types";

/** Phrases for the learner's level, drawn mostly from lessons they have finished. */
export function useGamePool(): Phrase[] {
  const p = useProgress();
  return useMemo(() => pickPool(unitsForLevel(p.level ?? "beginner"), p.completed), [p.level, p.completed]);
}

export function GameFrame({ title, children }: { title: string; children: (pool: Phrase[]) => ReactNode }) {
  const hydrated = useHydrated();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-16">
      <header className="flex items-center gap-4 py-4">
        <Link
          href="/games"
          aria-label="Back to games"
          className="grid h-10 w-10 place-items-center rounded-full text-2xl text-ink-soft hover:bg-line/60"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">{title}</h1>
      </header>
      {hydrated ? <Inner>{children}</Inner> : <div aria-busy="true" className="min-h-64" />}
    </div>
  );
}

function Inner({ children }: { children: (pool: Phrase[]) => ReactNode }) {
  const pool = useGamePool();
  return <main className="flex flex-1 flex-col gap-6">{children(pool)}</main>;
}

export function ResultCard({
  score,
  best,
  isBest,
  xp,
  onAgain,
  detail,
}: {
  score: number;
  best: number;
  isBest: boolean;
  xp: number;
  onAgain: () => void;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="kn text-5xl font-bold text-kumkuma">{isBest ? "ಅದ್ಭುತ!" : "ಶಭಾಷ್!"}</p>
      <p className="text-lg font-bold">{isBest ? "New best score!" : "Nice round!"}</p>
      <div className="flex gap-4">
        <div className="min-w-28 rounded-2xl border-2 border-arishina bg-arishina-wash px-4 py-3">
          <p className="text-sm font-semibold text-ink-soft">Score</p>
          <p className="text-3xl font-extrabold">{score}</p>
        </div>
        <div className="min-w-28 rounded-2xl border-2 border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink-soft">Best</p>
          <p className="text-3xl font-extrabold">{Math.max(best, score)}</p>
        </div>
      </div>
      {detail && <p className="text-ink-soft">{detail}</p>}
      <p className="text-ink-soft">+{xp} XP</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onAgain}
          className="press rounded-2xl bg-arishina px-8 py-4 text-lg font-bold text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)]"
        >
          Play again
        </button>
        <Link href="/games" className="press rounded-2xl border-2 border-line px-8 py-4 text-lg font-bold">
          All games
        </Link>
      </div>
    </div>
  );
}
