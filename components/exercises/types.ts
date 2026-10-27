import type { Phrase } from "@/lib/types";

/** What an exercise reports once the learner has given an answer that can be checked. */
export type Answer = {
  correct: boolean;
  /** Shown under the verdict, for example the right answer after a mistake */
  reveal?: string;
  /** Per-phrase result, for exercises that test several phrases (matching) */
  phraseResults?: Record<string, boolean>;
  /** Speaking practice only: the learner has had a go, so the button changes from Skip to Continue */
  attempted?: boolean;
  /** Speaking practice only: bonus XP for sounding right */
  xp?: number;
};

export type ExerciseProps<E> = {
  exercise: E;
  phrase: Phrase;
  /** Pool of phrases so exercises can look up their own text */
  phrases: Record<string, Phrase>;
  /** True after Check was pressed: the exercise stops accepting input */
  locked: boolean;
  /** Pass null while the learner has not answered yet, which keeps Check disabled */
  onAnswer: (answer: Answer | null) => void;
};
