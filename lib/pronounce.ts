// Standalone on purpose (no imports) so Node can run the tests directly.
// Compares what the speech recogniser heard with the phrase the learner was meant to say, word by word.

export type WordStatus = "ok" | "close" | "wrong" | "missing";
export type SlipKind = "length" | "aspirated" | "sibilant" | "retroflex" | "sound";

export type WordResult = {
  expected: string;
  heard: string | null;
  status: WordStatus;
  slip?: SlipKind;
};

export type PronounceReport = {
  words: WordResult[];
  /** Words that were heard but are not in the phrase */
  extra: string[];
  score: number;
  verdict: "great" | "close" | "retry";
  heard: string;
};

const KANNADA = /[ಀ-೿]/;

export function hasKannada(s: string): boolean {
  return KANNADA.test(s);
}

function clean(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[‌‍]/g, "")
    .replace(/[?!.,।॥"'“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function words(s: string): string[] {
  const c = clean(s);
  return c ? c.split(" ") : [];
}

function chars(s: string): string[] {
  return Array.from(s);
}

function distance(a: string[], b: string[]): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

function similarity(a: string, b: string): number {
  const x = chars(a);
  const y = chars(b);
  const longest = Math.max(x.length, y.length);
  return longest === 0 ? 1 : 1 - distance(x, y) / longest;
}

type Fold = [string, string];

// Pairs a recogniser (or a learner) easily mixes up. Folding both words the same way and comparing
// tells us which kind of slip it was.
const FOLDS: Record<Exclude<SlipKind, "sound">, Fold[]> = {
  length: [
    ["ಾ", ""], ["ೀ", "ಿ"], ["ೂ", "ು"], ["ೇ", "ೆ"], ["ೋ", "ೊ"],
    ["ಆ", "ಅ"], ["ಈ", "ಇ"], ["ಊ", "ಉ"], ["ಏ", "ಎ"], ["ಓ", "ಒ"],
  ],
  aspirated: [
    ["ಖ", "ಕ"], ["ಘ", "ಗ"], ["ಛ", "ಚ"], ["ಝ", "ಜ"], ["ಠ", "ಟ"],
    ["ಢ", "ಡ"], ["ಥ", "ತ"], ["ಧ", "ದ"], ["ಫ", "ಪ"], ["ಭ", "ಬ"],
  ],
  sibilant: [["ಶ", "ಸ"], ["ಷ", "ಸ"]],
  retroflex: [["ಟ", "ತ"], ["ಡ", "ದ"], ["ಣ", "ನ"], ["ಳ", "ಲ"]],
};

function fold(w: string, folds: Fold[]): string {
  let out = w;
  for (const [from, to] of folds) out = out.split(from).join(to);
  return out;
}

const ORDER: Exclude<SlipKind, "sound">[] = ["length", "aspirated", "sibilant", "retroflex"];

/** What kind of slip separates two different words, or null when they differ by more than a slip. */
export function classifySlip(expected: string, heard: string): SlipKind | null {
  for (const kind of ORDER) {
    if (fold(expected, FOLDS[kind]) === fold(heard, FOLDS[kind])) return kind;
  }
  const all = ORDER.flatMap((k) => FOLDS[k]);
  if (fold(expected, all) === fold(heard, all)) return "sound";
  return similarity(expected, heard) >= 0.7 ? "sound" : null;
}

const WEIGHT: Record<WordStatus, number> = { ok: 1, close: 0.7, wrong: 0.2, missing: 0 };
const GAP = 1;
const MIN_PAIR = 0.4;

/** Lines the expected words up with the heard words, allowing skipped and extra words. */
function align(exp: string[], got: string[]): { e: number | null; g: number | null }[] {
  const n = exp.length;
  const m = got.length;
  const cost = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) cost[i][0] = i * GAP;
  for (let j = 1; j <= m; j++) cost[0][j] = j * GAP;
  const pair = (i: number, j: number) => {
    const s = similarity(exp[i], got[j]);
    return s >= MIN_PAIR ? 1 - s : Infinity;
  };
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cost[i][j] = Math.min(cost[i - 1][j] + GAP, cost[i][j - 1] + GAP, cost[i - 1][j - 1] + pair(i - 1, j - 1));
    }
  }
  const out: { e: number | null; g: number | null }[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cost[i][j] === cost[i - 1][j - 1] + pair(i - 1, j - 1)) {
      out.push({ e: i - 1, g: j - 1 });
      i--;
      j--;
    } else if (i > 0 && cost[i][j] === cost[i - 1][j] + GAP) {
      out.push({ e: i - 1, g: null });
      i--;
    } else {
      out.push({ e: null, g: j - 1 });
      j--;
    }
  }
  return out.reverse();
}

/** Word-by-word report of one attempt. */
export function compareSpeech(expectedKn: string, heardKn: string): PronounceReport {
  const exp = words(expectedKn);
  const got = words(heardKn);
  const results: WordResult[] = exp.map((w) => ({ expected: w, heard: null, status: "missing" as WordStatus }));
  const extra: string[] = [];

  for (const step of align(exp, got)) {
    if (step.e === null && step.g !== null) {
      extra.push(got[step.g]);
    } else if (step.e !== null && step.g !== null) {
      const e = exp[step.e];
      const g = got[step.g];
      if (e === g) results[step.e] = { expected: e, heard: g, status: "ok" };
      else {
        const slip = classifySlip(e, g);
        results[step.e] = slip
          ? { expected: e, heard: g, status: "close", slip }
          : { expected: e, heard: g, status: "wrong", slip: "sound" };
      }
    }
  }

  const base = exp.length ? results.reduce((sum, r) => sum + WEIGHT[r.status], 0) / exp.length : 0;
  const score = Math.max(0, base - Math.min(0.3, extra.length * 0.1));
  const verdict = score >= 0.85 ? "great" : score >= 0.55 ? "close" : "retry";
  return { words: results, extra, score, verdict, heard: heardKn };
}

/** Best attempt among the recogniser's guesses. Null when none of them is in Kannada script. */
export function bestReport(alternatives: string[], expectedKn: string): PronounceReport | null {
  let best: PronounceReport | null = null;
  for (const alt of alternatives) {
    if (!hasKannada(alt)) continue;
    const r = compareSpeech(expectedKn, alt);
    if (!best || r.score > best.score) best = r;
  }
  return best;
}

const TIPS: Record<SlipKind, (w: string) => string> = {
  length: (w) => `Mind the vowel length in “${w}”. Hold the long vowels a little longer.`,
  aspirated: (w) => `“${w}” has a breathy consonant. Push a small puff of air on it.`,
  sibilant: (w) => `Check the s and sh sound in “${w}”.`,
  retroflex: (w) => `Curl your tongue back for the retroflex sound in “${w}”.`,
  sound: (w) => `One sound in “${w}” is off. Listen again, then say it slowly.`,
};

/** Plain-language advice for the first word that needs work, or a cheer when there is none. */
export function coachingLine(r: PronounceReport): string {
  const bad = r.words.find((w) => w.status === "close" || w.status === "wrong");
  if (r.verdict === "great" && !bad) return "Shabash! That sounded right.";
  const missing = r.words.filter((w) => w.status === "missing");
  if (bad) return TIPS[bad.slip ?? "sound"](bad.expected);
  if (missing.length) return `I did not hear “${missing[0].expected}”. Try the whole phrase once more.`;
  if (r.extra.length) return "I heard some extra words. Say just the phrase.";
  return "Almost there. Listen once more, then try again.";
}
