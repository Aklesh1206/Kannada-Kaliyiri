"use client";

import { playPhrase } from "@/lib/audio";

export function SpeakerButton({
  phraseId,
  kn,
  size = "md",
  label = "Play audio",
  variant = "yellow",
}: {
  phraseId: string;
  kn: string;
  size?: "md" | "lg";
  label?: string;
  /** Use "ink" when the button sits on a yellow background */
  variant?: "yellow" | "ink";
}) {
  const colour =
    variant === "ink"
      ? "bg-[#1c1b3a] text-white shadow-[0_4px_0_0_#000]"
      : "bg-arishina text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)]";
  const dim = size === "lg" ? "h-20 w-20" : "h-11 w-11";
  const icon = size === "lg" ? 36 : 22;
  return (
    <button
      type="button"
      onClick={() => playPhrase(phraseId, kn)}
      aria-label={label}
      className={`press grid ${dim} shrink-0 place-items-center rounded-full ${colour}`}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
      </svg>
    </button>
  );
}
