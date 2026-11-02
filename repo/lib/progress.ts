"use client";

import { useSyncExternalStore } from "react";
import type { Level } from "./types";

export type Progress = {
  xp: number;
  streak: number;
  /** Local date (YYYY-MM-DD) of the last finished lesson */
  lastActive: string | null;
  hearts: number;
  /** When hearts last changed, so they refill over time */
  heartsAt: number;
  /** lessonKey -> times finished */
  completed: Record<string, number>;
  /** Leitner boxes: phraseId -> box (1 to 5) and the date it is due for review */
  boxes: Record<string, { box: number; due: string }>;
  /** Skill level the learner picked; null until they choose */
  level: Level | null;
  /** Best score per mini-game */
  highScores: Record<string, number>;
  /** What Neela calls the learner; empty if they skipped */
  name: string;
  /** Show this learner on the public leaderboard */
  leaderboard: boolean;
};

export const MAX_HEARTS = 5;
export const HEART_REGEN_MS = 15 * 60 * 1000;
/** Days until a phrase comes back for review, indexed by Leitner box */
const BOX_DAYS = [0, 0, 1, 2, 4, 8, 16];

const KEY = "kfe:v1";
const EMPTY: Progress = {
  xp: 0,
  streak: 0,
  lastActive: null,
  hearts: MAX_HEARTS,
  heartsAt: 0,
  completed: {},
  boxes: {},
  level: null,
  highScores: {},
  name: "",
  leaderboard: true,
};

function dayString(d: Date) {
  return d.toLocaleDateString("en-CA");
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dayString(d);
}

export function regenHearts(p: Progress, now = Date.now()): Progress {
  if (p.hearts >= MAX_HEARTS) return p.heartsAt === 0 ? p : { ...p, heartsAt: 0 };
  const gained = Math.floor((now - p.heartsAt) / HEART_REGEN_MS);
  if (gained <= 0) return p;
  const hearts = Math.min(MAX_HEARTS, p.hearts + gained);
  return { ...p, hearts, heartsAt: hearts >= MAX_HEARTS ? 0 : p.heartsAt + gained * HEART_REGEN_MS };
}

let cache: Progress | null = null;
const listeners = new Set<() => void>();

/**
 * Guests keep nothing: progress lives in memory and is gone when the page is reloaded.
 * Only a signed-in learner (real account, or the local test account) has progress saved on this device.
 */
let persist: boolean | null = null;

function isSignedInOnDevice(): boolean {
  try {
    if (localStorage.getItem("kk:test_user")) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? "";
      if (/^sb-.+-auth-token$/.test(k)) return true; // Supabase keeps its session under this key
    }
  } catch {
    // storage unavailable: treat as guest
  }
  return false;
}

function persisting(): boolean {
  if (persist === null) persist = isSignedInOnDevice();
  return persist;
}

/** Called when a learner signs in (true) or out (false). Signing in saves what they have so far. */
export function setPersistence(on: boolean) {
  if (persist === on) return;
  persist = on;
  if (on) {
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot()));
    } catch {
      // storage unavailable, progress lives in memory for this tab
    }
  } else {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    cache = EMPTY;
    listeners.forEach((l) => l());
  }
}

function read(): Progress {
  if (!persisting()) return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return regenHearts({ ...EMPTY, ...JSON.parse(raw) });
  } catch {
    // private mode or corrupt data: start fresh
  }
  return EMPTY;
}

function snapshot(): Progress {
  if (!cache) cache = read();
  return cache;
}

function commit(next: Progress) {
  cache = next;
  if (persisting()) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage unavailable, progress lives in memory for this tab
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** True once the browser has read saved progress, so pages can avoid flashing empty state. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function setLevel(level: Level) {
  commit({ ...snapshot(), level });
}

/** Saves a mini-game result: the best score, plus a little XP that also keeps the streak. Returns true for a new best. */
export function recordGame(game: string, score: number, xp: number): boolean {
  const before = snapshot().highScores[game] ?? 0;
  const isBest = score > before;
  completeLesson(null, xp);
  if (isBest) {
    const p = snapshot();
    commit({ ...p, highScores: { ...p.highScores, [game]: score } });
  }
  return isBest;
}

/** Current progress outside React, for the cloud sync. */
export function getProgress(): Progress {
  return snapshot();
}

/** Replaces progress with merged data after signing in. */
export function replaceProgress(next: Progress) {
  commit(next);
}

export function setLeaderboard(show: boolean) {
  commit({ ...snapshot(), leaderboard: show });
}

export function setName(name: string) {
  commit({ ...snapshot(), name: name.trim().slice(0, 20) });
}

export function loseHeart() {
  const p = regenHearts(snapshot());
  commit({
    ...p,
    hearts: Math.max(0, p.hearts - 1),
    heartsAt: p.hearts >= MAX_HEARTS ? Date.now() : p.heartsAt,
  });
}

export function recordAnswer(phraseId: string, correct: boolean) {
  const p = snapshot();
  const today = dayString(new Date());
  const box = correct ? Math.min(5, (p.boxes[phraseId]?.box ?? 0) + 1) : 1;
  commit({ ...p, boxes: { ...p.boxes, [phraseId]: { box, due: addDays(today, BOX_DAYS[box]) } } });
}

/** Pass null for a review session: it earns XP and keeps the streak, but finishes no lesson. */
export function completeLesson(lessonKey: string | null, xpGained: number) {
  const p = snapshot();
  const today = dayString(new Date());
  let streak = p.streak;
  if (p.lastActive !== today) {
    const yesterday = addDays(today, -1);
    streak = p.lastActive === yesterday ? p.streak + 1 : 1;
  }
  commit({
    ...p,
    xp: p.xp + xpGained,
    streak,
    lastActive: today,
    completed: lessonKey ? { ...p.completed, [lessonKey]: (p.completed[lessonKey] ?? 0) + 1 } : p.completed,
  });
}

/** Phrase ids whose review date has arrived. */
export function duePhraseIds(p: Progress, today = dayString(new Date())): string[] {
  return Object.entries(p.boxes)
    .filter(([, v]) => v.due <= today)
    .map(([id]) => id);
}

/** A streak only counts if the learner was active today or yesterday. */
export function liveStreak(p: Progress, today = dayString(new Date())): number {
  if (!p.lastActive) return 0;
  return p.lastActive === today || p.lastActive === addDays(today, -1) ? p.streak : 0;
}
