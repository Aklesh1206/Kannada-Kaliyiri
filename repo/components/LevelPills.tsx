"use client";

import { LEVELS } from "@/lib/content";
import { setLevel, useProgress } from "@/lib/progress";
import type { Level } from "@/lib/types";

/** Always-visible level switcher. Pass onChange to run extra work, such as Neela's animation. */
export function LevelPills({ onChange }: { onChange?: (level: Level) => void }) {
  const level = useProgress().level ?? "beginner";
  return (
    <div role="radiogroup" aria-label="Skill level" className="flex gap-1 rounded-2xl bg-line p-1">
      {LEVELS.map((l) => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={l.id === level}
          onClick={() => (onChange ?? setLevel)(l.id)}
          className={`flex-1 rounded-xl px-2 py-2 text-base font-bold ${
            l.id === level ? "bg-paper text-ink shadow" : "text-ink-soft hover:bg-paper/50"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
