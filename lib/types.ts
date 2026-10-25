export type Phrase = {
  id: string;
  /** Kannada script */
  kn: string;
  /** Roman transliteration, how learners read and type it */
  tr: string;
  /** Other accepted spellings of the transliteration */
  alt?: string[];
  /** English meaning */
  en: string;
  /** Usage tip shown when the phrase is introduced */
  note?: string;
  /** Set to true only after a Kannada speaker has checked this phrase */
  reviewed: boolean;
};

export type Lesson = {
  id: string;
  title: string;
  blurb: string;
  /** Phrase ids from the same unit */
  phrases: string[];
};

export type Level = "beginner" | "intermediate" | "advanced";

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  /** Skill level this unit belongs to. Leave it out and the unit counts as beginner. */
  level?: Level;
  accent: "yellow" | "red";
  phrases: Phrase[];
  lessons: Lesson[];
};

export type QuestStep = {
  /** Short narration of the situation */
  scene: string;
  /** What the learner wants to say, in English */
  goal: string;
  /** Phrase id that does the job */
  answer: string;
  /** Phrase ids that do not */
  wrong: string[];
};

export type Quest = {
  id: string;
  title: string;
  blurb: string;
  icon: string;
  unitId: string;
  steps: QuestStep[];
};

export type ChooseMode = "kn-to-en" | "en-to-tr" | "listen-to-en";

export type Option = { id: string; label: string };

export type Exercise =
  | { kind: "intro"; phraseId: string }
  | { kind: "choose"; mode: ChooseMode; phraseId: string; options: Option[] }
  | { kind: "match"; pairs: { id: string; tr: string; en: string }[] }
  | { kind: "order"; phraseId: string; tokens: string[]; answer: string[] }
  | { kind: "type"; phraseId: string };
