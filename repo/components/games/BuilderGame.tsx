"use client";

import { useEffect, useRef, useState } from "react";
import type { Phrase } from "@/lib/types";
import { buildPoints, gameXp, makeBuild, orderCorrect, scoreKey } from "@/lib/games";
import type { BuildRound } from "@/lib/games";
import { recordGame, useProgress } from "@/lib/progress";
import { NeelaSays } from "../Neela";
import { SpeakerButton } from "../SpeakerButton";
import { ResultCard, useDifficulty } from "./GameFrame";
const PENALTY = 3;

type Result = { score: number; xp: number; isBest: boolean; prevBest: number; built: number };

export function BuilderGame({ pool }: { pool: Phrase[] }) {
  const { level, d } = useDifficulty();
  const SECONDS = d.builderSeconds;
  const best = useProgress().highScores[scoreKey("builder", level)] ?? 0;
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [round, setRound] = useState<BuildRound | null>(() => makeBuild(pool, Math.random, undefined, d.builderMin, d.builderMax));
  const [picked, setPicked] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [slips, setSlips] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const live = useRef({ score: 0, built: 0, best });
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
    const { score: s, built, best: prevBest } = live.current;
    const xp = gameXp(s);
    const isBest = recordGame(scoreKey("builder", level), s, xp);
    setResult({ score: s, xp, isBest, prevBest, built });
    setPhase("done");
  }, [over, level]);

  function start() {
    live.current = { score: 0, built: 0, best };
    setScore(0);
    setTimeLeft(SECONDS);
    setPicked([]);
    setSlips(0);
    setFlash(null);
    setRound(makeBuild(pool, Math.random, undefined, d.builderMin, d.builderMax));
    setPhase("play");
  }

  function tap(tileId: number) {
    if (!round || phase !== "play" || flash === "bad") return;
    const nextPicked = [...picked, tileId];
    setPicked(nextPicked);
    if (nextPicked.length < round.tiles.length) return;

    const words = nextPicked.map((id) => round.tiles.find((t) => t.id === id)?.text ?? "");
    if (orderCorrect(round.answer, words)) {
      const pts = buildPoints(slips === 0);
      live.current.score += pts;
      live.current.built += 1;
      setScore((s) => s + pts);
      setFlash("good");
      setTimeout(() => {
        setFlash(null);
        setPicked([]);
        setSlips(0);
        setRound(makeBuild(pool, Math.random, round.phrase.id, d.builderMin, d.builderMax));
      }, 500);
    } else {
      setFlash("bad");
      setSlips((n) => n + 1);
      setTimeLeft((t) => Math.max(0, t - PENALTY));
      setTimeout(() => {
        setFlash(null);
        setPicked([]);
      }, 700);
    }
  }

  function untap(tileId: number) {
    if (flash) return;
    setPicked((p) => p.filter((id) => id !== tileId));
  }

  if (!round) {
    return (
      <NeelaSays mood="sad">
        Not enough multi-word phrases here yet. Finish a few more lessons, then come back to build sentences.
      </NeelaSays>
    );
  }

  if (phase === "ready") {
    return (
      <>
        <NeelaSays mood="happy">
          Tap the word tiles in the right order to build each phrase. A wrong order costs {PENALTY} seconds.
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
        <NeelaSays mood="cheer">Time! You built {result.built} {result.built === 1 ? "phrase" : "phrases"}.</NeelaSays>
        <ResultCard
          score={result.score}
          best={result.prevBest}
          isBest={result.isBest}
          xp={result.xp}
          onAgain={start}
          detail={`${result.built} built`}
        />
      </>
    );
  }

  const tileById = (id: number) => round.tiles.find((t) => t.id === id)!;
  const bank = round.tiles.filter((t) => !picked.includes(t.id));
  const frame = flash === "good" ? "border-good bg-good-wash" : flash === "bad" ? "border-kumkuma bg-kumkuma-wash builder-shake" : "border-line";

  return (
    <>
      <div className="flex items-center justify-between font-bold">
        <span>Score {score}</span>
        <span className={timeLeft <= 10 ? "text-kumkuma" : ""}>{timeLeft}s</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full bg-arishina transition-[width] duration-1000 ease-linear" style={{ width: `${(timeLeft / SECONDS) * 100}%` }} />
      </div>
      <div className="flex items-center gap-4 rounded-2xl bg-arishina-wash px-5 py-4">
        <SpeakerButton phraseId={round.phrase.id} kn={round.phrase.kn} label="Hear the phrase" />
        <div>
          <p className="text-sm font-semibold text-ink-soft">Build the Kannada for</p>
          <p className="text-xl font-bold">{round.phrase.en}</p>
        </div>
      </div>
      <div
        className={`flex min-h-20 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3 ${frame}`}
        aria-label="Your phrase"
      >
        {picked.length === 0 && <span className="text-ink-soft">Tap the words below</span>}
        {picked.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => untap(id)}
            className="press rounded-xl border-2 border-arishina-deep bg-arishina px-4 py-2 text-lg font-bold text-[#1c1b3a]"
          >
            {tileById(id).text}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3" aria-label="Word tiles">
        {bank.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => tap(t.id)}
            className="press rounded-xl border-2 border-line bg-raised px-4 py-3 text-lg font-bold shadow-[0_4px_0_0_var(--line)]"
          >
            {t.text}
          </button>
        ))}
      </div>
    </>
  );
}
