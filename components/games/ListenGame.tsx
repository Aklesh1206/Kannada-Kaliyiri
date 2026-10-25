"use client";

import { useEffect, useState } from "react";
import type { Phrase } from "@/lib/types";
import { gameXp, makeQuestion } from "@/lib/games";
import type { Question } from "@/lib/games";
import { playPhrase } from "@/lib/audio";
import { recordGame, useProgress } from "@/lib/progress";
import { NeelaSays } from "../Neela";
import { ResultCard } from "./GameFrame";

const LIVES = 3;
type Result = { score: number; xp: number; isBest: boolean; prevBest: number };

export function ListenGame({ pool }: { pool: Phrase[] }) {
  const best = useProgress().highScores.listen ?? 0;
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(pool, 4));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [reveal, setReveal] = useState<{ pickedId: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const phrase = question.phrase;
  useEffect(() => {
    if (started && !result) playPhrase(phrase.id, phrase.kn);
  }, [started, result, phrase.id, phrase.kn]);

  function pick(id: string) {
    if (reveal || result) return;
    const right = id === phrase.id;
    const nextScore = right ? score + 10 + 5 * Math.min(streak, 5) : score;
    const nextLives = right ? lives : lives - 1;
    setReveal({ pickedId: id });
    setScore(nextScore);
    setStreak(right ? streak + 1 : 0);
    setLives(nextLives);
    setTimeout(() => {
      setReveal(null);
      if (nextLives <= 0) {
        const xp = gameXp(nextScore);
        const isBest = recordGame("listen", nextScore, xp);
        setResult({ score: nextScore, xp, isBest, prevBest: best });
        return;
      }
      setQuestion(makeQuestion(pool, 4, Math.random, phrase.id));
    }, right ? 900 : 1800);
  }

  function again() {
    setScore(0);
    setStreak(0);
    setLives(LIVES);
    setReveal(null);
    setResult(null);
    setQuestion(makeQuestion(pool, 4));
  }

  if (!started) {
    return (
      <>
        <NeelaSays mood="happy">
          I will say a phrase out loud and show you nothing. Listen closely, then pick what it means. Three misses and
          we are done. Sound on, please!
        </NeelaSays>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="press self-center rounded-2xl bg-arishina px-10 py-4 text-xl font-bold text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)]"
        >
          Start
        </button>
        <p className="text-center text-ink-soft">Best: {best}</p>
      </>
    );
  }

  if (result) {
    return (
      <>
        <NeelaSays mood="cheer">Sharp ears! Your best run was {streak > 0 ? "still going" : "a good one"}.</NeelaSays>
        <ResultCard score={result.score} best={result.prevBest} isBest={result.isBest} xp={result.xp} onAgain={again} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between font-bold">
        <span>Score {score}</span>
        <span className="text-arishina-deep">Streak {streak}</span>
        <span aria-label={`${lives} lives left`} className="text-kumkuma">
          {"❤".repeat(Math.max(0, lives))}
        </span>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-arishina-wash px-5 py-6">
        <p className="font-semibold text-ink-soft">What does this mean?</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => playPhrase(phrase.id, phrase.kn)}
            aria-label="Play again"
            className="press grid h-20 w-20 place-items-center rounded-full bg-arishina text-3xl shadow-[0_4px_0_0_var(--arishina-deep)]"
          >
            🔊
          </button>
          <button
            type="button"
            onClick={() => playPhrase(phrase.id, phrase.kn, true)}
            aria-label="Play slowly"
            className="press grid h-14 w-14 place-items-center rounded-full border-2 border-arishina-deep text-2xl"
          >
            🐢
          </button>
        </div>
        {reveal && (
          <div className="text-center" aria-live="polite">
            <p className="kn text-3xl font-bold">{phrase.kn}</p>
            <p className="text-ink-soft">{phrase.tr}</p>
          </div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((o) => {
          const isRight = o.id === phrase.id;
          let state = "border-line bg-raised";
          if (reveal && isRight) state = "border-good bg-good-wash";
          if (reveal && reveal.pickedId === o.id && !isRight) state = "border-kumkuma bg-kumkuma-wash";
          return (
            <button
              key={o.id}
              type="button"
              disabled={Boolean(reveal)}
              onClick={() => pick(o.id)}
              className={`press rounded-2xl border-2 px-4 py-4 text-left text-lg font-bold ${state}`}
            >
              {o.en}
            </button>
          );
        })}
      </div>
    </>
  );
}
