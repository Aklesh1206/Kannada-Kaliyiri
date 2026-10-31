"use client";

import type { ReactNode } from "react";

export type Mood = "idle" | "happy" | "sad" | "cheer" | "sleepy";

/**
 * Neela, a friendly Indian Roller (ನೀಲಕಂಠ, neelakanta), Karnataka's state bird.
 * An original drawing: teal head, rufous breast, bright blue wing, dark beak.
 */
export function Neela({ mood = "idle", size = 96, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  const motion =
    mood === "cheer" ? "neela-cheer" : mood === "happy" ? "neela-hop" : mood === "sad" ? "neela-droop" : "neela-bob";

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      className={`neela ${motion} ${className}`}
      data-mood={mood}
    >
      {/* branch */}
      <rect x="14" y="106" width="92" height="7" rx="3.5" fill="#7a5238" />
      {/* tail */}
      <path d="M44 92 L30 116 L50 113 L62 96 Z" fill="#1d4f9c" />
      <path d="M44 92 L36 106 L46 104 L54 94 Z" fill="#37b6d6" />
      {/* legs */}
      <path d="M58 98 V108 M68 98 V108" stroke="#c9733a" strokeWidth="3.5" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="57" cy="70" rx="28" ry="30" fill="#b06a4c" />
      <ellipse cx="68" cy="74" rx="17" ry="24" fill="#d79a7a" />
      {/* breast streaks */}
      <path
        d="M66 56 L70 64 M74 58 L77 66 M64 68 L68 76 M73 70 L76 78 M66 80 L69 87"
        stroke="#f6dccb"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* wing */}
      <g className="neela-wing">
        <path d="M38 54 C26 78 36 102 66 102 C82 94 82 70 72 54 Z" fill="#1f8fc4" />
        <path d="M44 66 C38 82 46 96 64 98 C74 90 74 76 68 66 Z" fill="#37b6d6" />
        <path d="M52 86 C56 94 62 96 66 98 C70 94 72 90 72 86 Z" fill="#1d4f9c" />
      </g>
      {/* head */}
      <circle cx="62" cy="36" r="21" fill="#1aa3a8" />
      <path d="M44 44 C50 56 70 56 78 46 C72 50 52 50 44 44 Z" fill="#c98462" />
      {/* beak */}
      <path d="M79 31 L102 38 L80 46 Z" fill="#2c2b36" />
      {/* eye */}
      <Eye mood={mood} />
      {mood === "cheer" && (
        <g fill="#ffc20e">
          <circle cx="24" cy="26" r="3" />
          <circle cx="98" cy="14" r="3" />
          <circle cx="16" cy="52" r="2.2" />
        </g>
      )}
      {mood === "sleepy" && (
        <text x="88" y="22" fontSize="14" fontWeight="700" fill="#5b5a78">
          z
        </text>
      )}
    </svg>
  );
}

function Eye({ mood }: { mood: Mood }) {
  if (mood === "happy" || mood === "cheer") {
    return <path d="M63 33 Q68 27 73 33" stroke="#1c1b3a" strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
  if (mood === "sleepy") {
    return <path d="M63 33 Q68 38 73 33" stroke="#1c1b3a" strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
  return (
    <g>
      <circle cx="68" cy="33" r="6" fill="#fff" />
      <circle cx={mood === "sad" ? 69 : 69.5} cy={mood === "sad" ? 35 : 33} r="3.2" fill="#1c1b3a" />
      {mood === "sad" && <path d="M61 25 L74 29" stroke="#1c1b3a" strokeWidth="2.2" strokeLinecap="round" />}
    </g>
  );
}

/** Neela with a speech bubble. Pass onClick to make her tappable. */
export function NeelaSays({
  mood = "idle",
  size = 88,
  onClick,
  label,
  children,
  tone = "paper",
}: {
  mood?: Mood;
  size?: number;
  onClick?: () => void;
  label?: string;
  children: ReactNode;
  tone?: "paper" | "good" | "bad";
}) {
  const bubble =
    tone === "good" ? "border-good bg-good-wash" : tone === "bad" ? "border-kumkuma bg-kumkuma-wash" : "border-line bg-paper";
  const bird = <Neela mood={mood} size={size} />;

  return (
    <div className="flex items-end gap-3">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={label ?? "Neela the Indian Roller. Tap for another tip."}
          className="press shrink-0 rounded-full"
        >
          {bird}
        </button>
      ) : (
        <span className="shrink-0">{bird}</span>
      )}
      <div
        className={`relative mb-2 rounded-2xl border-2 px-4 py-3 text-base ${bubble}`}
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className={`absolute -left-[9px] bottom-5 h-4 w-4 rotate-45 border-b-2 border-l-2 ${bubble}`}
        />
        {children}
      </div>
    </div>
  );
}
