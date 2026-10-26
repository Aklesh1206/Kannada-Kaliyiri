// Runtime code here must not import other lib files, so Node can run the tests directly.
import type { Level, Phrase, Quest, QuestStep, Unit } from "./types";

export type GameId = "memory" | "speed" | "catch" | "builder" | "listen";
type Rng = () => number;

/** How hard each game is at each level. Harder levels have more cards, less time, more choices and fewer hints. */
export type Difficulty = {
  memoryPairs: number;
  speedSeconds: number;
  speedOptions: number;
  catchOptions: number;
  /** Seconds a word takes to fall in round 0, and the quickest it ever gets */
  fallBase: number;
  fallFloor: number;
  builderSeconds: number;
  builderMin: number;
  builderMax: number;
  listenOptions: number;
  listenLives: number;
  questOptions: number;
  /** Show the Roman spelling next to Kannada script */
  showRoman: boolean;
  summary: string;
};

export const DIFFICULTY: Record<Level, Difficulty> = {
  beginner: {
    memoryPairs: 6, speedSeconds: 60, speedOptions: 3, catchOptions: 3, fallBase: 9.5, fallFloor: 4.5,
    builderSeconds: 75, builderMin: 2, builderMax: 4, listenOptions: 3, listenLives: 4, questOptions: 3, showRoman: true,
    summary: "Beginner mode: 6 card pairs, longer timers, 3 choices and Roman spelling shown.",
  },
  intermediate: {
    memoryPairs: 8, speedSeconds: 45, speedOptions: 4, catchOptions: 3, fallBase: 8, fallFloor: 3.5,
    builderSeconds: 60, builderMin: 2, builderMax: 5, listenOptions: 4, listenLives: 3, questOptions: 4, showRoman: true,
    summary: "Intermediate mode: 8 card pairs, 45 second rounds, 4 choices.",
  },
  advanced: {
    memoryPairs: 10, speedSeconds: 30, speedOptions: 5, catchOptions: 4, fallBase: 6.5, fallFloor: 2.8,
    builderSeconds: 45, builderMin: 3, builderMax: 7, listenOptions: 5, listenLives: 2, questOptions: 4, showRoman: false,
    summary: "Advanced mode: 10 card pairs, 30 second rounds, 5 choices and no Roman spelling. Read the script!",
  },
};

/** High scores are kept per level, so each level has its own leaderboard. */
export function scoreKey(game: string, level: Level): string {
  return `${game}:${level}`;
}

export const GAMES: { id: GameId; title: string; blurb: string; icon: string }[] = [
  { id: "memory", title: "Memory Flip", blurb: "Flip cards and match each Kannada phrase to its meaning.", icon: "🃏" },
  { id: "speed", title: "Speed Round", blurb: "45 seconds. Build a combo for bonus points.", icon: "⚡" },
  { id: "catch", title: "Sky Catch", blurb: "Catch the right word before it falls. Three lives.", icon: "🪶" },
  { id: "builder", title: "Word Builder", blurb: "Tap the tiles in the right order to build the phrase.", icon: "🧱" },
  { id: "listen", title: "Listen Up", blurb: "No text, just sound. Hear it, then pick the meaning.", icon: "👂" },
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
export function fallSeconds(round: number, base = 8, floor = 3.5): number {
  return Math.max(floor, base - round * 0.35);
}

/** Words of a transliteration without punctuation. */
export function trTokens(tr: string): string[] {
  return tr.replace(/[?!.,]/g, "").split(/\s+/).filter(Boolean);
}

export type Tile = { id: number; text: string };
export type BuildRound = { phrase: Phrase; answer: string[]; tiles: Tile[] };

/** A phrase of 2 to 7 words, cut into shuffled tiles. Null when the pool has no such phrase. */
export function makeBuild(pool: Phrase[], rng: Rng = Math.random, avoidId?: string, min = 2, max = 7): BuildRound | null {
  const within = (lo: number, hi: number) => (p: Phrase) => {
    const n = trTokens(p.tr).length;
    return n >= lo && n <= hi;
  };
  // If the level has no phrase of the wanted length, fall back to any usable phrase
  const ranged = pool.filter(within(min, max));
  const all = ranged.length ? ranged : pool.filter(within(2, 7));
  const list = all.filter((p) => p.id !== avoidId);
  const options = list.length ? list : all;
  if (!options.length) return null;
  const phrase = options[Math.floor(rng() * options.length)];
  const answer = trTokens(phrase.tr);
  const base = answer.map((text, id) => ({ id, text }));
  let tiles = shuffled(base, rng);
  for (let i = 0; i < 10 && tiles.every((t, k) => t.text === answer[k]); i++) tiles = shuffled(base, rng);
  return { phrase, answer, tiles };
}

export function orderCorrect(answer: string[], picked: string[]): boolean {
  return answer.length === picked.length && answer.every((t, i) => t.toLowerCase() === picked[i].toLowerCase());
}

/** Word Builder: points for a built phrase, with a bonus for getting it right the first time. */
export function buildPoints(firstTry: boolean): number {
  return firstTry ? 15 : 10;
}

/** The options for one quest step: the right phrase among the wrong ones, shuffled. */
export function questOptions(step: QuestStep, byId: Record<string, Phrase>, rng: Rng = Math.random, count?: number): Phrase[] {
  const wrong = count ? step.wrong.slice(0, Math.max(1, count - 1)) : step.wrong;
  return shuffled([step.answer, ...wrong].map((id) => byId[id]).filter((p): p is Phrase => Boolean(p)), rng);
}

export function questScore(steps: number, mistakes: number): number {
  return Math.max(50, steps * 100 - mistakes * 25);
}

export function questStars(mistakes: number): 1 | 2 | 3 {
  return mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1;
}

/** Problems with a quest's content, for tests: unknown phrases, answer listed as wrong, too few options. */
export function questProblems(quest: Quest, known: Set<string>): string[] {
  const out: string[] = [];
  quest.steps.forEach((s, i) => {
    const at = `${quest.id} step ${i + 1}`;
    for (const id of [s.answer, ...s.wrong]) if (!known.has(id)) out.push(`${at}: unknown phrase ${id}`);
    if (s.wrong.includes(s.answer)) out.push(`${at}: answer is also listed as wrong`);
    if (new Set(s.wrong).size < 2) out.push(`${at}: needs at least 2 different wrong answers`);
  });
  return out;
}
