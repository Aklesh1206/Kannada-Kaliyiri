// Per-level rules. Runtime code here must not import other lib files, so Node can run the tests directly.
import type { Level } from "./types";

export type Rules = {
  level: Level;
  /** Show the Roman spelling under Kannada script in games and quizzes. Lessons' intro cards always show it. */
  showTr: boolean;
  /** Wrong answers per lesson question, so a question has this many plus one options */
  lessonDistractors: number;
  /** How many exercise types a lesson mixes: listening-only questions arrive at higher levels */
  lessonModes: ("kn-to-en" | "en-to-tr" | "listen-to-en")[];
  lessonMatchPairs: number;
  lessonOrder: number;
  lessonType: number;

  speed: { seconds: number; penalty: number; options: number };
  memory: { pairs: number; hint: boolean };
  catch: { lives: number; options: number; fallStart: number; fallFloor: number; script: boolean };
  builder: { seconds: number; penalty: number; minWords: number; maxWords: number; decoys: number };
  listen: { lives: number; options: number };
  quest: { options: number };

  /** Lines for each game's start screen, so the learner sees exactly what this level changes */
  summary: Record<"speed" | "memory" | "catch" | "builder" | "listen" | "quest", string>;
};

const BEGINNER: Rules = {
  level: "beginner",
  showTr: true,
  lessonDistractors: 2,
  lessonModes: ["kn-to-en", "en-to-tr"],
  lessonMatchPairs: 3,
  lessonOrder: 1,
  lessonType: 1,
  speed: { seconds: 60, penalty: 2, options: 3 },
  memory: { pairs: 4, hint: true },
  catch: { lives: 5, options: 3, fallStart: 10, fallFloor: 6, script: false },
  builder: { seconds: 75, penalty: 2, minWords: 2, maxWords: 4, decoys: 0 },
  listen: { lives: 5, options: 3 },
  quest: { options: 3 },
  summary: {
    speed: "60 seconds, 3 choices, a wrong answer costs 2 seconds. Roman spelling is shown.",
    memory: "4 pairs, and the Roman spelling is shown on each Kannada card.",
    catch: "5 lives, 3 slow falling words, Roman spelling shown.",
    builder: "75 seconds, phrases of 2 to 4 words, no extra tiles.",
    listen: "5 lives and 3 choices.",
    quest: "3 choices per scene, Roman spelling shown.",
  },
};

const INTERMEDIATE: Rules = {
  level: "intermediate",
  showTr: true,
  lessonDistractors: 3,
  lessonModes: ["kn-to-en", "en-to-tr", "listen-to-en"],
  lessonMatchPairs: 4,
  lessonOrder: 2,
  lessonType: 2,
  speed: { seconds: 45, penalty: 3, options: 4 },
  memory: { pairs: 6, hint: true },
  catch: { lives: 3, options: 3, fallStart: 8, fallFloor: 3.5, script: false },
  builder: { seconds: 60, penalty: 3, minWords: 2, maxWords: 6, decoys: 1 },
  listen: { lives: 3, options: 4 },
  quest: { options: 4 },
  summary: {
    speed: "45 seconds, 4 choices, a wrong answer costs 3 seconds.",
    memory: "6 pairs, with the Roman spelling as a hint.",
    catch: "3 lives, words fall at normal speed.",
    builder: "60 seconds, phrases of 2 to 6 words, 1 extra tile to avoid.",
    listen: "3 lives and 4 choices.",
    quest: "4 choices per scene, Roman spelling shown.",
  },
};

const ADVANCED: Rules = {
  level: "advanced",
  showTr: false,
  lessonDistractors: 4,
  lessonModes: ["listen-to-en", "en-to-tr", "kn-to-en", "listen-to-en"],
  lessonMatchPairs: 5,
  lessonOrder: 3,
  lessonType: 3,
  speed: { seconds: 35, penalty: 4, options: 5 },
  memory: { pairs: 8, hint: false },
  catch: { lives: 2, options: 4, fallStart: 6, fallFloor: 2.5, script: true },
  builder: { seconds: 45, penalty: 4, minWords: 3, maxWords: 8, decoys: 2 },
  listen: { lives: 2, options: 5 },
  quest: { options: 5 },
  summary: {
    speed: "35 seconds, 5 choices, Kannada script only, a wrong answer costs 4 seconds.",
    memory: "8 pairs and no Roman spelling hints. Read the script.",
    catch: "2 lives, 4 fast falling words shown in Kannada script.",
    builder: "45 seconds, phrases of 3 to 8 words, 2 extra tiles to avoid.",
    listen: "2 lives and 5 choices.",
    quest: "5 choices per scene, Kannada script only.",
  },
};

export const RULES: Record<Level, Rules> = {
  beginner: BEGINNER,
  intermediate: INTERMEDIATE,
  advanced: ADVANCED,
};

export function rulesFor(level: Level | null | undefined): Rules {
  return RULES[level ?? "beginner"] ?? BEGINNER;
}

/** Sky Catch: seconds a word takes to fall. It speeds up each round, down to the level's floor. */
export function fallFor(rules: Rules, round: number): number {
  return Math.max(rules.catch.fallFloor, rules.catch.fallStart - round * 0.35);
}
