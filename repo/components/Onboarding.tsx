"use client";

import { useState } from "react";
import { LEVELS } from "@/lib/content";
import { setLevel, setName, useProgress } from "@/lib/progress";
import type { Level } from "@/lib/types";
import { Neela, NeelaSays } from "./Neela";
import type { Mood } from "./Neela";

const STEPS = 4;

/** Neela greets a new learner, introduces herself, asks their name and how much Kannada they know. */
export function Onboarding() {
  const saved = useProgress().name;
  const [step, setStep] = useState(0);
  const [name, setNameDraft] = useState(saved);
  const [picked, setPicked] = useState<Level | null>(null);
  const cleanName = name.trim();
  const pickedInfo = LEVELS.find((l) => l.id === picked);

  function finish() {
    if (picked) setLevel(picked);
  }

  const mood: Mood = step === 3 ? "cheer" : step === 0 ? "happy" : "idle";

  return (
    <section aria-labelledby="onboard-heading" className="flex flex-col gap-8 pt-4">
      <ol className="flex justify-center gap-2" aria-label={`Step ${step + 1} of ${STEPS}`}>
        {Array.from({ length: STEPS }, (_, i) => (
          <li key={i} className={`h-2 w-10 rounded-full ${i <= step ? "bg-arishina-deep" : "bg-line"}`} />
        ))}
      </ol>

      <div key={step} className="onboard-step flex flex-col gap-6">
        {step === 0 && (
          <>
            <div className="flex justify-center">
              <Neela mood={mood} size={160} />
            </div>
            <div className="text-center">
              <p className="kn text-5xl font-extrabold text-kumkuma">ನಮಸ್ಕಾರ!</p>
              <h1 id="onboard-heading" className="mt-2 text-3xl font-extrabold">
                I am Neela
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-lg text-ink-soft">
                I am an Indian Roller, or <span className="kn font-bold">ನೀಲಕಂಠ</span> in Kannada, and Karnataka&apos;s
                state bird. I will be your guide while you learn the Kannada people really speak.
              </p>
            </div>
            <Next onClick={() => setStep(1)}>Nice to meet you</Next>
          </>
        )}

        {step === 1 && (
          <>
            <NeelaSays mood={mood} size={96}>
              <span id="onboard-heading" className="font-bold">
                What should I call you?
              </span>
            </NeelaSays>
            <label className="flex flex-col gap-2">
              <span className="text-base font-semibold text-ink-soft">Your name (optional)</span>
              <input
                value={name}
                maxLength={20}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setName(cleanName);
                    setStep(2);
                  }
                }}
                autoComplete="given-name"
                className="rounded-2xl border-2 border-line bg-raised px-4 py-3 text-xl font-bold focus:border-arishina-deep focus:outline-none"
              />
            </label>
            <Next
              onClick={() => {
                setName(cleanName);
                setStep(2);
              }}
            >
              {cleanName ? "Continue" : "Skip"}
            </Next>
            <Back onClick={() => setStep(0)} />
          </>
        )}

        {step === 2 && (
          <>
            <NeelaSays mood={mood} size={96}>
              <span id="onboard-heading" className="font-bold">
                {cleanName ? `${cleanName}, how` : "How"} much Kannada do you know?
              </span>
              <span className="block text-ink-soft">Not sure? Beginner is a safe start. You can change it any time.</span>
            </NeelaSays>
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Skill level">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={picked === l.id}
                  onClick={() => setPicked(l.id)}
                  className={`press rounded-2xl border-2 px-5 py-4 text-left ${
                    picked === l.id
                      ? "border-arishina-deep bg-arishina-wash shadow-[0_4px_0_0_var(--arishina-deep)]"
                      : "border-line bg-raised shadow-[0_4px_0_0_var(--line)]"
                  }`}
                >
                  <span className="block text-xl font-bold">{l.label}</span>
                  <span className="block text-base text-ink-soft">{l.blurb}</span>
                </button>
              ))}
            </div>
            <Next disabled={!picked} onClick={() => setStep(3)}>
              Continue
            </Next>
            <Back onClick={() => setStep(1)} />
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex justify-center">
              <Neela mood={mood} size={150} />
            </div>
            <div className="text-center">
              <h1 id="onboard-heading" className="text-3xl font-extrabold">
                {cleanName ? `Great, ${cleanName}!` : "Great!"}
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-lg text-ink-soft">
                Your {pickedInfo?.label.toLowerCase()} path is ready. Finish a lesson each day to keep your streak, and I
                will cheer you on.
              </p>
            </div>
            <Next onClick={finish}>Start learning</Next>
            <Back onClick={() => setStep(2)} />
          </>
        )}
      </div>
    </section>
  );
}

function Next({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="press self-center rounded-2xl bg-arishina px-10 py-4 text-lg font-bold text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)] disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft disabled:shadow-[0_4px_0_0_var(--line)]"
    >
      {children}
    </button>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="self-center text-base font-semibold text-ink-soft underline">
      Back
    </button>
  );
}
