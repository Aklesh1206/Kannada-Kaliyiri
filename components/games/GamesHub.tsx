"use client";

import Link from "next/link";
import { quests } from "@/lib/content";
import { GAMES } from "@/lib/games";
import { useHydrated, useProgress } from "@/lib/progress";
import { NeelaSays } from "../Neela";
import { useGamePool } from "./GameFrame";

export function GamesHub() {
  const p = useProgress();
  const hydrated = useHydrated();
  const pool = useGamePool();
  const level = hydrated ? (p.level ?? "beginner") : "beginner";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24">
      <header className="flex items-center gap-4 py-4">
        <Link
          href="/"
          aria-label="Back to the path"
          className="grid h-10 w-10 place-items-center rounded-full text-2xl text-ink-soft hover:bg-line/60"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">Games</h1>
      </header>
      <main className="flex flex-col gap-5">
        <NeelaSays mood="happy">
          Play with {hydrated ? pool.length : "your"} {level} phrases. Games earn XP and keep your streak alive.
        </NeelaSays>
        <h2 className="text-xl font-extrabold">Quick games</h2>
        {GAMES.map((g) => (
          <Link
            key={g.id}
            href={`/games/${g.id}`}
            className="press flex items-center gap-4 rounded-2xl border-2 border-line bg-raised px-5 py-4 shadow-[0_4px_0_0_var(--line)]"
          >
            <span className="text-4xl" aria-hidden="true">
              {g.icon}
            </span>
            <span className="flex-1">
              <span className="block text-xl font-bold">{g.title}</span>
              <span className="block text-base text-ink-soft">{g.blurb}</span>
            </span>
            <span className="text-right text-sm font-semibold text-ink-soft">
              Best
              <span className="block text-xl font-extrabold text-ink">{hydrated ? (p.highScores[g.id] ?? 0) : 0}</span>
            </span>
          </Link>
        ))}
        <h2 className="mt-4 text-xl font-extrabold">Story quests</h2>
        {quests.map((q) => (
          <Link
            key={q.id}
            href={`/games/quest/${q.id}`}
            className="press flex items-center gap-4 rounded-2xl border-2 border-kumkuma bg-kumkuma-wash px-5 py-4 shadow-[0_4px_0_0_var(--kumkuma)]"
          >
            <span className="text-4xl" aria-hidden="true">
              {q.icon}
            </span>
            <span className="flex-1">
              <span className="block text-xl font-bold">{q.title}</span>
              <span className="block text-base text-ink-soft">{q.blurb}</span>
            </span>
            <span className="text-right text-sm font-semibold text-ink-soft">
              Best
              <span className="block text-xl font-extrabold text-ink">{hydrated ? (p.highScores[`quest:${q.id}`] ?? 0) : 0}</span>
            </span>
          </Link>
        ))}
      </main>
    </div>
  );
}
