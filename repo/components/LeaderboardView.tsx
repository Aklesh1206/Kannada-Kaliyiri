"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cloudConfigured, fetchLeaderboard } from "@/lib/cloud";
import type { LeaderRow } from "@/lib/cloud";
import { LEVELS } from "@/lib/content";
import { GAMES, scoreKey } from "@/lib/games";
import { useProgress } from "@/lib/progress";
import type { Level } from "@/lib/types";
import { NeelaSays } from "./Neela";

type Loaded = { key: string; rows: LeaderRow[] | null };

export function LeaderboardView() {
  const mine = useProgress().level ?? "beginner";
  const [game, setGame] = useState<string>(GAMES[0].id);
  const [chosen, setChosen] = useState<Level | null>(null);
  const level = chosen ?? mine;
  const key = scoreKey(game, level);
  const [loaded, setLoaded] = useState<Loaded>({ key: "", rows: null });
  const configured = cloudConfigured();

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    fetchLeaderboard(key)
      .then((rows) => !cancelled && setLoaded({ key, rows }))
      .catch(() => !cancelled && setLoaded({ key, rows: null }));
    return () => {
      cancelled = true;
    };
  }, [key, configured]);

  if (!configured) {
    return (
      <NeelaSays mood="idle">
        The leaderboard needs cloud save, which is not switched on for this copy of the app. See supabase/SETUP.md.
      </NeelaSays>
    );
  }

  const loading = loaded.key !== key;
  const rows = loaded.rows;

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Level" className="flex gap-1 rounded-2xl bg-line p-1">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={l.id === level}
            onClick={() => setChosen(l.id)}
            className={`flex-1 rounded-xl px-2 py-2 text-base font-bold ${l.id === level ? "bg-paper text-ink shadow" : "text-ink-soft"}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Game">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={g.id === game}
            onClick={() => setGame(g.id)}
            className={`rounded-xl border-2 px-3 py-2 font-bold ${g.id === game ? "border-arishina-deep bg-arishina-wash" : "border-line"}`}
          >
            {g.icon} {g.title}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-soft" aria-busy="true">
          Loading…
        </p>
      ) : rows === null ? (
        <NeelaSays mood="sad">I could not load the leaderboard. Check your connection and try again.</NeelaSays>
      ) : rows.length === 0 ? (
        <NeelaSays mood="happy">
          Nobody is on this board yet. Be the first!{" "}
          <Link href={`/games/${game}`} className="font-bold underline">
            Play now
          </Link>
        </NeelaSays>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-4 rounded-2xl border-2 border-line bg-raised px-4 py-3">
              <span className="w-8 text-center text-xl font-extrabold text-arishina-deep">{i + 1}</span>
              <span className="flex-1 text-lg font-bold">{r.display_name}</span>
              <span className="text-xl font-extrabold">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
