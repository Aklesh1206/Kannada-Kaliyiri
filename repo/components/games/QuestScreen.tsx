"use client";

import { useRef, useState } from "react";
import { getPhrase } from "@/lib/content";
import { gameXp, questOptions, questScore, questStars, scoreKey } from "@/lib/games";
import { recordGame, useHydrated, useProgress } from "@/lib/progress";
import type { Phrase, Quest } from "@/lib/types";
import { NeelaSays } from "../Neela";
import { SpeakerButton } from "../SpeakerButton";
import { GameShell, ResultCard, useDifficulty } from "./GameFrame";

export function QuestScreen({ quest }: { quest: Quest }) {
  const hydrated = useHydrated();
  return (
    <GameShell title={quest.title}>
      {hydrated ? <Quest_ quest={quest} /> : <div aria-busy="true" className="min-h-64" />}
    </GameShell>
  );
}

function Quest_({ quest }: { quest: Quest }) {
  const { level } = useDifficulty();
  const key = scoreKey(`quest:${quest.id}`, level);
  const best = useProgress().highScores[key] ?? 0;
  const [round, setRound] = useState(0);
  // A new level starts the story again with that level's rules
  return <Run key={`${round}-${level}`} quest={quest} gameKey={key} best={best} onAgain={() => setRound((r) => r + 1)} />;
}

type Outcome = { score: number; stars: number; xp: number; isBest: boolean; prevBest: number };

function Run({ quest, gameKey, best, onAgain }: { quest: Quest; gameKey: string; best: number; onAgain: () => void }) {
  const { d } = useDifficulty();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solved, setSolved] = useState<Phrase | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const busy = useRef(false);

  const [byId] = useState<Record<string, Phrase>>(() => {
    const ids = quest.steps.flatMap((s) => [s.answer, ...s.wrong]);
    const map: Record<string, Phrase> = {};
    for (const id of ids) {
      const p = getPhrase(id);
      if (p) map[id] = p;
    }
    return map;
  });
  const [optionSets] = useState(() => quest.steps.map((s) => questOptions(s, byId, Math.random, d.questOptions)));

  const total = quest.steps.length;
  const current = quest.steps[step];

  function pick(p: Phrase) {
    if (busy.current || wrongIds.includes(p.id)) return;
    if (p.id !== current.answer) {
      setMistakes((m) => m + 1);
      setWrongIds((w) => [...w, p.id]);
      return;
    }
    busy.current = true;
    setSolved(p);
    setTimeout(() => {
      busy.current = false;
      setSolved(null);
      setWrongIds([]);
      if (step + 1 < total) {
        setStep(step + 1);
        return;
      }
      const score = questScore(total, mistakes);
      const xp = gameXp(score);
      setOutcome({ score, stars: questStars(mistakes), xp, isBest: recordGame(gameKey, score, xp), prevBest: best });
    }, 1300);
  }

  if (!started) {
    return (
      <>
        <div className="flex justify-center text-7xl" aria-hidden="true">
          {quest.icon}
        </div>
        <NeelaSays mood="happy">
          {quest.blurb} I will narrate. You choose what to say in Kannada. Wrong picks cost a little, so think first!
        </NeelaSays>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="press self-center rounded-2xl bg-arishina px-10 py-4 text-xl font-bold text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)]"
        >
          Begin the story
        </button>
        <p className="text-center text-ink-soft">Best: {best}</p>
      </>
    );
  }

  if (outcome) {
    return (
      <>
        <NeelaSays mood="cheer">
          {mistakes === 0
            ? "Perfect! You sound like a local."
            : outcome.stars === 3
              ? "Great job! One tiny slip."
              : "Story complete! Try again for more stars."}
        </NeelaSays>
        <ResultCard
          score={outcome.score}
          best={outcome.prevBest}
          isBest={outcome.isBest}
          xp={outcome.xp}
          onAgain={onAgain}
          stars={outcome.stars}
          detail={`${mistakes} ${mistakes === 1 ? "slip" : "slips"}`}
        />
      </>
    );
  }

  return (
    <>
      <ol className="flex items-center gap-1" aria-label={`Scene ${step + 1} of ${total}`}>
        {quest.steps.map((_, i) => (
          <li key={i} className="flex flex-1 items-center">
            <span className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-good" : i === step ? "bg-arishina-deep" : "bg-line"}`} />
            {i === step && (
              <span className="mx-1 text-2xl" aria-hidden="true">
                {quest.icon}
              </span>
            )}
          </li>
        ))}
      </ol>

      <div key={step} className="onboard-step flex flex-col gap-5">
        <NeelaSays mood={solved ? "happy" : wrongIds.length ? "sad" : "idle"} size={72}>
          <span className="block text-sm font-semibold text-ink-soft">
            Scene {step + 1} of {total}
          </span>
          {current.scene}
        </NeelaSays>

        <div className="rounded-2xl bg-arishina-wash px-5 py-4 text-center">
          <p className="text-sm font-semibold text-ink-soft">Your goal</p>
          <p className="text-2xl font-bold">{current.goal}</p>
        </div>

        <div className="flex flex-col gap-3">
          {optionSets[step].map((o) => {
            const isWrong = wrongIds.includes(o.id);
            const isSolved = solved?.id === o.id;
            return (
              <div key={o.id} className="flex items-center gap-3">
                <SpeakerButton phraseId={o.id} kn={o.kn} label={d.showRoman ? `Hear ${o.tr}` : "Hear this phrase"} />
                <button
                  type="button"
                  disabled={isWrong || Boolean(solved)}
                  onClick={() => pick(o)}
                  className={`press flex-1 rounded-2xl border-2 px-4 py-3 text-left ${
                    isSolved
                      ? "border-good bg-good-wash"
                      : isWrong
                        ? "border-kumkuma bg-kumkuma-wash opacity-60"
                        : "border-line bg-raised shadow-[0_4px_0_0_var(--line)]"
                  }`}
                >
                  <span className="kn block text-2xl font-bold">{o.kn}</span>
                  {d.showRoman && <span className="block text-base text-ink-soft">{o.tr}</span>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="min-h-8 text-center font-semibold" aria-live="polite">
          {solved && <span className="text-good">Correct! “{solved.en}”</span>}
          {!solved && wrongIds.length > 0 && <span className="text-kumkuma">Not quite. Try another one.</span>}
        </div>
      </div>
    </>
  );
}
