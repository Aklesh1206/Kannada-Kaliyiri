"use client";

import { useEffect, useRef, useState } from "react";
import type { Phrase } from "@/lib/types";
import { gameXp, makeQuestion, scoreKey, speedPoints } from "@/lib/games";
import type { Question } from "@/lib/games";
import { recordGame, useProgress } from "@/lib/progress";
import { NeelaSays } from "../Neela";
import { ResultCard, useDifficulty } from "./GameFrame";
const PENALTY = 3;

type Result = { score: number; xp: number; isBest: boolean; prevBest: number; right: number };

export function SpeedGame({ pool }: { pool: Phrase[] }) {
  const { level, d } = useDifficulty();
  const SECONDS = d.speedSeconds;
  const best = useProgress().highScores[scoreKey("speed", level)] ?? 0;
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [question, setQuestion] = useState<Question>(() => makeQuestion(pool, d.speedOptions));
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const live = useRef({ score: 0, right: 0, best });
  useEffect(() => {
    live.current.best = best;
  }, [best]);

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const over = phase === "play" && timeLeft <= 0;
  useEffect(() => {
    if (!over) return;
    const { score: s, right: r, best: prevBest } = live.current;
    const xp = gameXp(s);
    const isBest = recordGame(scoreKey("speed", level), s, xp);
    // Finishing is a one-time event, so the result is stored once when time runs out
    setResult({ score: s, xp, isBest, prevBest, right: r });
    setPhase("done");
  }, [over, level]);

  function start() {
    live.current = { score: 0, right: 0, best };
    setScore(0);
    setCombo(0);
    setTimeLeft(SECONDS);
    setFlash(null);
    setQuestion(makeQuestion(pool, d.speedOptions));
    setPhase("play");
  }

  function answer(id: string) {
    if (phase !== "play") return;
    if (id === question.phrase.id) {
      const pts = speedPoints(combo);
      live.current.score += pts;
      live.current.right += 1;
      setScore((s) => s + pts);
      setCombo((c) => c + 1);
      setFlash("good");
    } else {
      setCombo(0);
      setTimeLeft((t) => Math.max(0, t - PENALTY));
      setFlash("bad");
    }
    setQuestion(makeQuestion(pool, d.speedOptions, Math.random, question.phrase.id));
  }

  useEffect(() => {
    if (phase !== "play") return;
    function onKey(e: KeyboardEvent) {
      const n = Number(e.key);
      if (n >= 1 && n <= question.options.length) answer(question.options[n - 1].id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase === "ready") {
    return (
      <>
        <NeelaSays mood="happy">
          Pick the right meaning as fast as you can. Every 3 in a row raises your bonus. A wrong answer costs {PENALTY}{" "}
          seconds.
        </NeelaSays>
        <button
          type="button"
          onClick={start}
          className="press self-center rounded-2xl bg-arishina px-10 py-4 text-xl font-bold text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)]"
        >
          Start
        </button>
        <p className="text-center text-ink-soft">Best: {best}</p>
      </>
    );
  }

  if (phase === "done" && result) {
    return (
      <>
        <NeelaSays mood="cheer">Time! You got {result.right} right.</NeelaSays>
        <ResultCard
          score={result.score}
          best={result.prevBest}
          isBest={result.isBest}
          xp={result.xp}
          onAgain={start}
          detail={`${result.right} correct`}
        />
      </>
    );
  }

  const mult = 1 + Math.min(3, Math.floor(combo / 3));
  return (
    <>
      <div className="flex items-center justify-between font-bold">
        <span>Score {score}</span>
        <span className={timeLeft <= 10 ? "text-kumkuma" : ""} aria-live="off">
          {timeLeft}s
        </span>
        <span className="text-arishina-deep">Combo x{mult}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full bg-arishina transition-[width] duration-1000 ease-linear" style={{ width: `${(timeLeft / SECONDS) * 100}%` }} />
      </div>
      <div
        className={`rounded-2xl border-2 px-5 py-6 text-center ${
          flash === "good" ? "border-good bg-good-wash" : flash === "bad" ? "border-kumkuma bg-kumkuma-wash" : "border-line"
        }`}
      >
        <p className="kn text-4xl font-bold">{question.phrase.kn}</p>
        {d.showRoman && <p className="text-lg text-ink-soft">{question.phrase.tr}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onClick={() => answer(o.id)}
            className="press rounded-2xl border-2 border-line bg-raised px-4 py-4 text-left text-lg font-bold shadow-[0_4px_0_0_var(--line)]"
          >
            <span className="mr-3 inline-grid h-7 w-7 place-items-center rounded-lg border-2 border-line text-sm text-ink-soft">
              {i + 1}
            </span>
            {o.en}
          </button>
        ))}
      </div>
    </>
  );
}
