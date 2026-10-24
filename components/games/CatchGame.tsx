"use client";

import { useEffect, useState } from "react";
import type { Phrase } from "@/lib/types";
import { fallSeconds, gameXp, makeQuestion } from "@/lib/games";
import type { Question } from "@/lib/games";
import { recordGame, useProgress } from "@/lib/progress";
import { Neela, NeelaSays } from "../Neela";
import { ResultCard } from "./GameFrame";

const LIVES = 3;
type Result = { score: number; xp: number; isBest: boolean; prevBest: number };

export function CatchGame({ pool }: { pool: Phrase[] }) {
  const best = useProgress().highScores.catch ?? 0;
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(pool, 3));
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [wrong, setWrong] = useState<string[]>([]);
  const [mood, setMood] = useState<"idle" | "happy" | "sad">("idle");
  const [result, setResult] = useState<Result | null>(null);

  function nextRound(nextScore: number, nextLives: number) {
    if (nextLives <= 0) {
      const xp = gameXp(nextScore * 10);
      const isBest = recordGame("catch", nextScore * 10, xp);
      setResult({ score: nextScore * 10, xp, isBest, prevBest: best });
      return;
    }
    setQuestion(makeQuestion(pool, 3, Math.random, question.phrase.id));
    setWrong([]);
    setRound((r) => r + 1);
  }

  function pick(id: string) {
    if (result || wrong.includes(id)) return;
    if (id === question.phrase.id) {
      setScore((s) => s + 1);
      setMood("happy");
      nextRound(score + 1, lives);
    } else {
      setMood("sad");
      setLives((l) => l - 1);
      setWrong((w) => [...w, id]);
      if (lives - 1 <= 0) nextRound(score, 0);
    }
  }

  function missed() {
    if (result) return;
    setMood("sad");
    setLives((l) => l - 1);
    nextRound(score, lives - 1);
  }

  useEffect(() => {
    if (!started || result) return;
    function onKey(e: KeyboardEvent) {
      const n = Number(e.key);
      if (n >= 1 && n <= question.options.length) pick(question.options[n - 1].id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function again() {
    setScore(0);
    setLives(LIVES);
    setRound(0);
    setWrong([]);
    setMood("idle");
    setResult(null);
    setQuestion(makeQuestion(pool, 3));
  }

  if (!started) {
    return (
      <>
        <NeelaSays mood="happy">
          Words fall from the sky. Tap the one that means what you see before it lands. Three misses and we are done.
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
        <NeelaSays mood="cheer">You caught {score} {score === 1 ? "word" : "words"}!</NeelaSays>
        <ResultCard
          score={result.score}
          best={result.prevBest}
          isBest={result.isBest}
          xp={result.xp}
          onAgain={again}
          detail={`${score} caught`}
        />
      </>
    );
  }

  const secs = fallSeconds(round);
  return (
    <>
      <div className="flex items-center justify-between font-bold">
        <span>Caught {score}</span>
        <span aria-label={`${lives} lives left`} className="text-kumkuma">
          {"❤".repeat(Math.max(0, lives))}
        </span>
      </div>
      <div className="rounded-2xl bg-arishina-wash px-5 py-4 text-center" aria-live="polite">
        <p className="text-sm font-semibold text-ink-soft">Catch the Kannada for</p>
        <p className="text-2xl font-bold">{question.phrase.en}</p>
      </div>
      <div key={round} className="relative h-96 overflow-hidden rounded-2xl border-2 border-line bg-gradient-to-b from-arishina-wash to-paper">
        {question.options.map((o, i) => {
          const isRight = o.id === question.phrase.id;
          const isWrong = wrong.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              disabled={isWrong}
              onClick={() => pick(o.id)}
              onAnimationEnd={isRight ? missed : undefined}
              style={{ left: `${i * 33.33 + 1.5}%`, animationDuration: `${secs}s` }}
              className={`sky-fall press absolute w-[30%] rounded-xl border-2 px-2 py-3 text-center text-sm font-bold sm:text-base ${
                isWrong ? "border-kumkuma bg-kumkuma-wash opacity-50" : "border-arishina-deep bg-raised"
              }`}
            >
              <span className="mr-1 text-ink-soft">{i + 1}</span>
              {o.tr}
            </button>
          );
        })}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <Neela mood={mood} size={64} />
        </div>
      </div>
    </>
  );
}
