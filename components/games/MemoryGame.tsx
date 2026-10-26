"use client";

import { useRef, useState } from "react";
import type { Phrase } from "@/lib/types";
import { makeDeck, memoryScore, gameXp, scoreKey } from "@/lib/games";
import { recordGame, useProgress } from "@/lib/progress";
import { NeelaSays } from "../Neela";
import { ResultCard, useDifficulty } from "./GameFrame";

export function MemoryGame({ pool }: { pool: Phrase[] }) {
  const { level } = useDifficulty();
  const best = useProgress().highScores[scoreKey("memory", level)] ?? 0;
  const [round, setRound] = useState(0);
  return <Board key={round} pool={pool} best={best} onAgain={() => setRound((r) => r + 1)} />;
}

function Board({ pool, best, onAgain }: { pool: Phrase[]; best: number; onAgain: () => void }) {
  const { level, d } = useDifficulty();
  const [cards] = useState(() => makeDeck(pool, d.memoryPairs));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<{ score: number; xp: number; isBest: boolean; prevBest: number } | null>(null);
  const busy = useRef(false);
  const pairs = cards.length / 2;

  function flip(i: number) {
    if (busy.current || open.includes(i) || matched.includes(cards[i].pairId)) return;
    const nextOpen = [...open, i];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    const nextMoves = moves + 1;
    setMoves(nextMoves);
    busy.current = true;
    const [a, b] = nextOpen;
    const isMatch = cards[a].pairId === cards[b].pairId;
    setTimeout(() => {
      setOpen([]);
      busy.current = false;
      if (!isMatch) return;
      const nextMatched = [...matched, cards[a].pairId];
      setMatched(nextMatched);
      if (nextMatched.length === pairs) {
        const score = memoryScore(pairs, nextMoves);
        const xp = gameXp(score);
        const prevBest = best;
        setResult({ score, xp, isBest: recordGame(scoreKey("memory", level), score, xp), prevBest });
      }
    }, isMatch ? 450 : 900);
  }

  if (result) {
    return (
      <>
        <NeelaSays mood="cheer">{result.isBest ? "A new record! Neela is flapping with joy." : "All matched!"}</NeelaSays>
        <ResultCard
          score={result.score}
          best={result.prevBest}
          isBest={result.isBest}
          xp={result.xp}
          onAgain={onAgain}
          detail={`Finished in ${moves} moves`}
        />
      </>
    );
  }

  return (
    <>
      <NeelaSays mood={open.length === 1 ? "idle" : "happy"}>
        Match each Kannada phrase with its meaning. Fewer moves, higher score.
      </NeelaSays>
      <p className="text-center font-bold" aria-live="polite">
        Moves {moves} · Matched {matched.length}/{pairs}
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {cards.map((c, i) => {
          const isOpen = open.includes(i) || matched.includes(c.pairId);
          const done = matched.includes(c.pairId);
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => flip(i)}
              aria-label={isOpen ? `${c.text}${c.sub && d.showRoman ? `, ${c.sub}` : ""}` : "Hidden card"}
              className={`press flex min-h-28 flex-col items-center justify-center rounded-2xl border-2 p-2 text-center ${
                done
                  ? "border-good bg-good-wash"
                  : isOpen
                    ? "border-arishina-deep bg-arishina-wash"
                    : "border-line bg-arishina text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)]"
              }`}
            >
              {isOpen ? (
                <>
                  <span className={`font-bold ${c.side === "kn" ? "kn text-xl" : "text-base"}`}>{c.text}</span>
                  {c.sub && d.showRoman && <span className="text-sm text-ink-soft">{c.sub}</span>}
                </>
              ) : (
                <span className="text-3xl" aria-hidden="true">
                  ?
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
