// Runtime code here must not import other lib files, so Node can run the tests directly.
import type { Phrase, Unit } from "./types";

export type GameId = "memory" | "speed" | "catch";
type Rng = () => number;

export const GAMES: { id: GameId; title: string; blurb: string; icon: string }[] = [
  { id: "memory", title: "Memory Flip", blurb: "Flip cards and match each Kannada phrase to its meaning.", icon: "🃏" },
  { id: "speed", title: "Speed Round", blurb: "45 seconds. Build a combo for bonus points.", icon: "⚡" },
  { id: "catch", title: "Sky Catch", blurb: "Catch the right word before it falls. Three lives.", icon: "🪶" },
];

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Phrases a game may use: those from finished lessons, or every phrase of the level
 * when the learner has finished too few. Duplicates are dropped.
 */
export function pickPool(units: Unit[], completed: Record<string, number>, min = 6): Phrase[] {
  const learned = new Map<string, Phrase>();
  const all = new Map<string, Phrase>();
  for (const u of units) {
    const byId = new Map(u.phrases.map((p) => [p.id, p]));
    for (const p of u.phrases) all.set(p.id, p);
    for (const l of u.lessons) {
      if (!completed[`${u.id}/${l.id}`]) continue;
      for (const id of l.phrases) {
        const p = byId.get(id);
        if (p) learned.set(p.id, p);
      }
    }
  }
  return [...(learned.size >= min ? learned : all).values()];
}

/** Short phrases fit on a card; fall back to everything when there are too few. */
export function shortPhrases(pool: Phrase[], need: number, maxEn = 32): Phrase[] {
  const short = pool.filter((p) => p.en.length <= maxEn);
  return short.length >= need ? short : pool;
}

export type Card = { key: string; pairId: string; side: "kn" | "en"; text: string; sub?: string };

/** Two cards per phrase: Kannada on one, English on the other. */
export function makeDeck(pool: Phrase[], pairs: number, rng: Rng = Math.random): Card[] {
  const chosen = shuffled(shortPhrases(pool, pairs), rng).slice(0, pairs);
  const cards = chosen.flatMap((p): Card[] => [
    { key: `${p.id}:kn`, pairId: p.id, side: "kn", text: p.kn, sub: p.tr },
    { key: `${p.id}:en`, pairId: p.id, side: "en", text: p.en },
  ]);
  return shuffled(cards, rng);
}

export function memoryScore(pairs: number, moves: number): number {
  return Math.max(50, 100 * pairs - 25 * Math.max(0, moves - pairs));
}

export type Question = { phrase: Phrase; options: Phrase[] };

/** One multiple-choice question with distinct wrong answers. */
export function makeQuestion(pool: Phrase[], optionCount: number, rng: Rng = Math.random, avoidId?: string): Question {
  const pickFrom = pool.filter((p) => p.id !== avoidId);
  const phrase = (pickFrom.length ? pickFrom : pool)[Math.floor(rng() * (pickFrom.length || pool.length))];
  const seen = new Set([phrase.en.toLowerCase(), phrase.tr.toLowerCase()]);
  const wrong: Phrase[] = [];
  for (const p of shuffled(pool, rng)) {
    if (p.id === phrase.id || seen.has(p.en.toLowerCase()) || seen.has(p.tr.toLowerCase())) continue;
    seen.add(p.en.toLowerCase());
    seen.add(p.tr.toLowerCase());
    wrong.push(p);
    if (wrong.length === optionCount - 1) break;
  }
  return { phrase, options: shuffled([phrase, ...wrong], rng) };
}

/** Speed round: points per right answer grow with the combo, up to x4. */
export function speedPoints(combo: number): number {
  return 10 * (1 + Math.min(3, Math.floor(combo / 3)));
}

/** XP earned from a game score, capped so games cannot out-earn lessons. */
export function gameXp(score: number): number {
  if (score <= 0) return 0;
  return Math.min(20, Math.max(2, Math.round(score / 40)));
}

/** Sky Catch: seconds a word takes to fall, faster each round but never below 3.5. */
export function fallSeconds(round: number): number {
  return Math.max(3.5, 8 - round * 0.35);
}
