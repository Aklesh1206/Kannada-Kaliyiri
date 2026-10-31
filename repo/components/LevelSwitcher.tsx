"use client";

import { LEVELS } from "@/lib/content";
import { setLevel, useProgress } from "@/lib/progress";
import type { Level } from "@/lib/types";

/**
 * Three big buttons, always visible, that switch the level in one tap.
 * The level changes the lessons you see and the rules of every game.
 */
export function LevelSwitcher({ onPick }: { onPick?: (to: Level) => void }) {
  const level: Level = useProgress().level ?? "beginner";
  return (
    <div role="radiogroup" aria-label="Choose your level" className="grid grid-cols-3 gap-2" data-testid="level-switcher">
      {LEVELS.map((l) => {
        const on = l.id === level;
        return (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => (onPick ? onPick(l.id) : setLevel(l.id))}
            className={`press rounded-2xl border-2 px-2 py-3 text-center ${
              on
                ? "border-arishina-deep bg-arishina text-[#1c1b3a] shadow-[0_3px_0_0_var(--arishina-deep)]"
                : "border-line bg-paper shadow-[0_3px_0_0_var(--line)]"
            }`}
          >
            <span className="block text-base font-extrabold sm:text-lg">{l.label}</span>
                      </button>
        );
      })}
    </div>
  );
}
