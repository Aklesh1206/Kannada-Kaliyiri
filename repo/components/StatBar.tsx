"use client";

import { HEART_REGEN_MS, MAX_HEARTS, liveStreak, useHydrated, useProgress } from "@/lib/progress";

export function Hearts({ hearts, className = "" }: { hearts: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-kumkuma ${className}`} aria-label={`${hearts} hearts left`}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 21s-7.5-4.6-9.6-9.2C.8 8.3 2.6 4.5 6.3 4.5c2.1 0 3.9 1.1 5.7 3.3 1.8-2.2 3.6-3.3 5.7-3.3 3.7 0 5.5 3.8 3.9 7.3C19.5 16.4 12 21 12 21z"
        />
      </svg>
      {hearts}
    </span>
  );
}

export function StatBar() {
  const p = useProgress();
  const hydrated = useHydrated();
  const streak = hydrated ? liveStreak(p) : 0;

  return (
    <div className="flex items-center gap-4 text-base font-bold" aria-live="polite">
      <span className="inline-flex items-center gap-1 text-arishina-deep" aria-label={`${streak} day streak`}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M13 2s.6 3.6-1.7 6.2C9.4 10.3 8 11.8 8 14.2 8 17.4 10.2 20 13 20s5-2.2 5-5.4c0-2.4-1.2-4-2.3-5.3-.4 1.1-1 1.7-1.7 2C14.2 9 13.9 5.2 13 2z" />
        </svg>
        {streak}
      </span>
      <span className="inline-flex items-center gap-1 text-ink" aria-label={`${hydrated ? p.xp : 0} experience points`}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-arishina text-[11px] font-extrabold text-[#1c1b3a]">XP</span>
        {hydrated ? p.xp : 0}
      </span>
      <Hearts hearts={hydrated ? p.hearts : MAX_HEARTS} />
    </div>
  );
}

export function nextHeartIn(heartsAt: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((heartsAt + HEART_REGEN_MS - now) / 60000));
}
