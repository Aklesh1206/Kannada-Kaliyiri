// Runtime code here must not import other lib files, so Node can run the tests directly.
import type { ChooseMode, Exercise, Phrase } from "./types";

export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Words of a transliteration, without punctuation, for the word-order exercise. */
export function tokenize(tr: string): string[] {
  return tr.replace(/[?!.,]/g, "").split(/\s+/).filter(Boolean);
}

function distractors(target: Phrase, pool: Phrase[], count: number, rng: Rng): Phrase[] {
  const seen = new Set([target.en.toLowerCase(), target.tr.toLowerCase()]);
  const out: Phrase[] = [];
  for (const p of shuffle(pool, rng)) {
    if (p.id === target.id) continue;
    const en = p.en.toLowerCase();
    const tr = p.tr.toLowerCase();
    if (seen.has(en) || seen.has(tr)) continue;
    seen.add(en);
    seen.add(tr);
    out.push(p);
    if (out.length === count) break;
  }
  return out;
}

function choose(mode: ChooseMode, target: Phrase, pool: Phrase[], rng: Rng): Exercise {
  const options = shuffle([target, ...distractors(target, pool, 3, rng)], rng).map((p) => ({
    id: p.id,
    label: mode === "en-to-tr" ? p.tr : p.en,
  }));
  return { kind: "choose", mode, phraseId: target.id, options };
}

/** Phrase ids an exercise tests, used to update spaced-repetition boxes. */
export function exercisePhraseIds(ex: Exercise): string[] {
  if (ex.kind === "match") return ex.pairs.map((p) => p.id);
  return [ex.phraseId];
}

/**
 * Turns a lesson's phrases into a queue of exercises:
 * intro cards first, then multiple choice and matching, then word order and typing.
 * `pool` supplies wrong answers, so pass every phrase in the unit.
 */
export function buildLesson(phrases: Phrase[], pool: Phrase[], rng: Rng = Math.random): Exercise[] {
  const modes: ChooseMode[] = ["kn-to-en", "en-to-tr", "listen-to-en"];

  const intros: Exercise[] = phrases.map((p) => ({ kind: "intro", phraseId: p.id }));

  const middle: Exercise[] = [];
  phrases.forEach((p, i) => {
    middle.push(choose(modes[i % 3], p, pool, rng));
    middle.push(choose(modes[(i + 1) % 3], p, pool, rng));
  });
  if (phrases.length >= 3) {
    const pairs = shuffle(phrases, rng)
      .slice(0, 4)
      .map((p) => ({ id: p.id, tr: p.tr, en: p.en }));
    middle.push({ kind: "match", pairs });
  }

  const hard: Exercise[] = [];
  const multiWord = shuffle(
    phrases.filter((p) => tokenize(p.tr).length >= 3),
    rng,
  ).slice(0, 2);
  for (const p of multiWord) {
    const answer = tokenize(p.tr);
    let tokens = shuffle(answer, rng);
    if (tokens.join(" ") === answer.join(" ")) tokens = shuffle(answer, rng);
    hard.push({ kind: "order", phraseId: p.id, tokens, answer });
  }
  for (const p of shuffle(phrases, rng).slice(0, 2)) {
    hard.push({ kind: "type", phraseId: p.id });
  }

  return [...intros, ...shuffle(middle, rng), ...hard];
}
