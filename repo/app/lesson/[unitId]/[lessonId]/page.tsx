import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/LessonPlayer";
import { getLesson, lessonKey, units } from "@/lib/content";

export function generateStaticParams() {
  return units.flatMap((u) => u.lessons.map((l) => ({ unitId: u.id, lessonId: l.id })));
}

export default async function LessonPage({ params }: { params: Promise<{ unitId: string; lessonId: string }> }) {
  const { unitId, lessonId } = await params;
  const found = getLesson(unitId, lessonId);
  if (!found) notFound();
  const { unit, lesson, phrases } = found;

  return (
    <LessonPlayer
      title={lesson.title}
      lessonKey={lessonKey(unit.id, lesson.id)}
      phrases={phrases}
      pool={unit.phrases}
      backHref="/"
    />
  );
}
