"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Exercise, Phrase } from "@/lib/types";
import { buildLesson, exercisePhraseIds } from "@/lib/exercises";
import { completeLesson, loseHeart, recordAnswer, useHydrated, useProgress } from "@/lib/progress";
import { Neela } from "./Neela";
import { Hearts, nextHeartIn } from "./StatBar";
import { Intro } from "./exercises/Intro";
import { ChooseExercise } from "./exercises/Choose";
import { MatchExercise } from "./exercises/Match";
import { OrderExercise } from "./exercises/Order";
import { TypeExercise } from "./exercises/TypeIt";
import type { Answer } from "./exercises/types";

const CHEERS = ["ಶಭಾಷ್!", "ಚೆನ್ನಾಗಿದೆ!", "ಸೂಪರ್!", "Well done!", "Neela is impressed!"];
const NUDGES = ["Almost! It will come back soon.", "No worries, you will get it next time.", "Good try. Listen once more."];

type Props = {
  title: string;
  /** Marks the lesson finished. Null for review sessions */
  lessonKey: string | null;
  phrases: Phrase[];
  /** Every phrase that may appear as a wrong answer */
  pool: Phrase[];
  backHref: string;
};

export function LessonPlayer(props: Props) {
  // The queue is shuffled, so build it only in the browser to avoid a server/client mismatch
  const hydrated = useHydrated();
  if (!hydrated) return <div className="min-h-screen" aria-busy="true" />;
  return <Player {...props} />;
}

function Player({ title, lessonKey, phrases, pool, backHref }: Props) {
  const progress = useProgress();
  const byId = useMemo(() => Object.fromEntries(pool.map((p) => [p.id, p])), [pool]);

  const [queue, setQueue] = useState<Exercise[]>(() => buildLesson(phrases, pool));
  const [graded] = useState(() => queue.filter((e) => e.kind !== "intro").length);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [checked, setChecked] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState<{ xp: number; accuracy: number } | null>(null);

  const exercise = queue[index];
  const isIntro = exercise?.kind === "intro";
  const outOfHearts = progress.hearts === 0 && !finished;

  const markIntroReady = useCallback(() => setAnswer({ correct: true }), []);

  const next = useCallback(() => {
    if (index + 1 >= queue.length) {
      const right = Math.max(0, graded - wrongCount);
      const xp = 10 + right;
      completeLesson(lessonKey, xp);
      setFinished({ xp, accuracy: graded ? Math.round((right / graded) * 100) : 100 });
      return;
    }
    setIndex(index + 1);
    setAnswer(null);
    setChecked(false);
  }, [index, queue.length, graded, wrongCount, lessonKey]);

  const check = useCallback(() => {
    if (!answer || !exercise) return;
    if (isIntro) return next();
    setChecked(true);
    for (const id of exercisePhraseIds(exercise)) {
      recordAnswer(id, answer.phraseResults ? (answer.phraseResults[id] ?? true) : answer.correct);
    }
    if (!answer.correct) {
      setWrongCount((n) => n + 1);
      loseHeart();
      // Mistakes come back at the end, so every exercise is eventually answered correctly
      setQueue((q) => [...q, exercise]);
    }
  }, [answer, exercise, isIntro, next]);

  const primary = checked || isIntro ? next : check;
  const primaryEnabled = isIntro ? Boolean(answer) : checked || Boolean(answer);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Buttons in the footer (Check, Continue) and links already react to Enter on their own.
      // Answer buttons do not, so Enter on them means "check my answer".
      const target = e.target as HTMLElement;
      if (e.key !== "Enter" || target.closest("footer") || target instanceof HTMLAnchorElement) return;
      if (!primaryEnabled || outOfHearts || finished) return;
      e.preventDefault();
      primary();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [primary, primaryEnabled, outOfHearts, finished]);

  if (finished) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Neela mood="cheer" size={140} />
          <p className="kn text-7xl font-bold text-kumkuma">ಶಭಾಷ್!</p>
          <h1 className="text-3xl font-bold">{title} done</h1>
          <div className="flex gap-4">
            <Result label="XP earned" value={`+${finished.xp}`} tone="yellow" />
            <Result label="Accuracy" value={`${finished.accuracy}%`} tone="green" />
          </div>
          <p className="max-w-sm text-ink-soft">
            Phrases you missed will come back for review, so you remember them for good.
          </p>
        </div>
        <Footer tone="good">
          <Link href={backHref} className={bigButton("good")}>
            Back to the path
          </Link>
        </Footer>
      </Shell>
    );
  }

  if (outOfHearts) {
    const minutes = nextHeartIn(progress.heartsAt);
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Neela mood="sleepy" size={120} />
          <Hearts hearts={0} className="text-4xl" />
          <h1 className="text-3xl font-bold">You are out of hearts</h1>
          <p className="max-w-sm text-lg text-ink-soft">
            Your next heart arrives in about {minutes} {minutes === 1 ? "minute" : "minutes"}. Take a break, then
            come back to finish this lesson.
          </p>
        </div>
        <Footer tone="bad">
          <Link href={backHref} className={bigButton("bad")}>
            Back to the path
          </Link>
        </Footer>
      </Shell>
    );
  }

  const phrase = byId[exercise.kind === "match" ? exercise.pairs[0].id : exercise.phraseId];
  const lockedOut = checked;
  const done = index / queue.length;

  return (
    <Shell>
      <header className="flex items-center gap-4 py-4">
        <Link
          href={backHref}
          aria-label="Leave lesson"
          className="grid h-10 w-10 place-items-center rounded-full text-2xl text-ink-soft hover:bg-line/60"
        >
          ×
        </Link>
        <div
          className="h-4 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(done * 100)}
          aria-label="Lesson progress"
        >
          <div className="h-full rounded-full bg-arishina transition-[width] duration-300" style={{ width: `${done * 100}%` }} />
        </div>
        <Hearts hearts={progress.hearts} className="text-lg" />
      </header>

      <main className="flex-1 pb-8 pt-4" key={index}>
        {exercise.kind === "intro" && <Intro phrase={phrase} onReady={markIntroReady} />}
        {exercise.kind === "choose" && (
          <ChooseExercise exercise={exercise} phrase={phrase} phrases={byId} locked={lockedOut} onAnswer={setAnswer} />
        )}
        {exercise.kind === "match" && <MatchExercise exercise={exercise} locked={lockedOut} onAnswer={setAnswer} />}
        {exercise.kind === "order" && (
          <OrderExercise exercise={exercise} phrase={phrase} phrases={byId} locked={lockedOut} onAnswer={setAnswer} />
        )}
        {exercise.kind === "type" && (
          <TypeExercise exercise={exercise} phrase={phrase} phrases={byId} locked={lockedOut} onAnswer={setAnswer} />
        )}
      </main>

      <Footer tone={checked ? (answer?.correct ? "good" : "bad") : "neutral"}>
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-h-12" aria-live="assertive">
            {checked && answer && (
              <div className="flex items-center gap-3">
                <Neela mood={answer.correct ? "happy" : "sad"} size={56} />
                <div>
                <p className={`text-2xl font-bold ${answer.correct ? "text-good" : "text-kumkuma"}`}>
                  {answer.correct ? (answer.reveal ? "Close enough" : "Correct") : "Not quite"}
                </p>
                {answer.reveal && (
                  <p className="text-base">
                    {answer.correct ? "Spelled " : "Answer: "}
                    <span className="font-bold">{answer.reveal}</span>
                  </p>
                )}
                <p className="text-sm text-ink-soft">
                  {answer.correct ? CHEERS[index % CHEERS.length] : NUDGES[index % NUDGES.length]}
                </p>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={!primaryEnabled}
            onClick={primary}
            className={bigButton(checked ? (answer?.correct ? "good" : "bad") : "neutral")}
          >
            {isIntro ? "Got it" : checked ? "Continue" : "Check"}
          </button>
        </div>
      </Footer>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-36">{children}</div>;
}

function Footer({ tone, children }: { tone: "neutral" | "good" | "bad"; children: React.ReactNode }) {
  const bg = tone === "good" ? "bg-good-wash" : tone === "bad" ? "bg-kumkuma-wash" : "bg-paper";
  return (
    <footer className={`fixed inset-x-0 bottom-0 border-t-2 border-line ${bg}`}>
      <div className="mx-auto flex max-w-2xl items-center px-4 py-5">{children}</div>
    </footer>
  );
}

function bigButton(tone: "neutral" | "good" | "bad") {
  const colour =
    tone === "good"
      ? "bg-good text-white shadow-[0_4px_0_0_#14693a]"
      : tone === "bad"
        ? "bg-kumkuma text-white shadow-[0_4px_0_0_var(--kumkuma-deep)]"
        : "bg-arishina text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)] disabled:bg-line disabled:text-ink-soft disabled:shadow-[0_4px_0_0_var(--line)]";
  return `press inline-flex min-w-36 items-center justify-center rounded-2xl px-8 py-4 text-lg font-bold ${colour} disabled:cursor-not-allowed`;
}

function Result({ label, value, tone }: { label: string; value: string; tone: "yellow" | "green" }) {
  return (
    <div
      className={`min-w-32 rounded-2xl border-2 px-5 py-4 ${tone === "yellow" ? "border-arishina bg-arishina-wash" : "border-good bg-good-wash"}`}
    >
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="text-3xl font-extrabold">{value}</p>
    </div>
  );
}
