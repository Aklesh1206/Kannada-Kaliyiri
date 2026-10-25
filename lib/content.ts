import greetings from "@/content/units/greetings.json";
import auto from "@/content/units/auto.json";
import conversation from "@/content/units/conversation.json";
import opinions from "@/content/units/opinions.json";
import quests_ from "@/content/quests.json";
import type { Lesson, Level, Phrase, Quest, Unit } from "./types";

export const quests: Quest[] = quests_ as Quest[];

/** Units appear on the home path in this order. Add a new JSON file and list it here. */
export const units: Unit[] = [greetings, auto, conversation, opinions] as Unit[];

export const allPhrases: Phrase[] = units.flatMap((u) => u.phrases);

export function getUnit(unitId: string): Unit | undefined {
  return units.find((u) => u.id === unitId);
}

export function getLesson(
  unitId: string,
  lessonId: string,
): { unit: Unit; lesson: Lesson; phrases: Phrase[] } | undefined {
  const unit = getUnit(unitId);
  const lesson = unit?.lessons.find((l) => l.id === lessonId);
  if (!unit || !lesson) return undefined;
  const phrases = lesson.phrases
    .map((id) => unit.phrases.find((p) => p.id === id))
    .filter((p): p is Phrase => Boolean(p));
  return { unit, lesson, phrases };
}

export function getPhrase(id: string): Phrase | undefined {
  return allPhrases.find((p) => p.id === id);
}

export function lessonKey(unitId: string, lessonId: string) {
  return `${unitId}/${lessonId}`;
}

/** Flat list used to decide which lesson unlocks next. */
export const lessonOrder: string[] = units.flatMap((u) =>
  u.lessons.map((l) => lessonKey(u.id, l.id)),
);

export const LEVELS: { id: Level; label: string; blurb: string }[] = [
  { id: "beginner", label: "Beginner", blurb: "I am new. Teach me the first words and phrases." },
  { id: "intermediate", label: "Intermediate", blurb: "I know the basics. Help me hold a conversation." },
  { id: "advanced", label: "Advanced", blurb: "I am comfortable. Give me opinions, courtesy and nuance." },
];

export function unitLevel(unit: Unit): Level {
  return unit.level ?? "beginner";
}

export function unitsForLevel(level: Level): Unit[] {
  return units.filter((u) => unitLevel(u) === level);
}

/** Lesson keys of one level, in order. The next lesson unlocks within a level, so you can start at any level. */
export function lessonOrderForLevel(level: Level): string[] {
  return unitsForLevel(level).flatMap((u) => u.lessons.map((l) => lessonKey(u.id, l.id)));
}
