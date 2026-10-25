import { notFound } from "next/navigation";
import { QuestScreen } from "@/components/games/QuestScreen";
import { quests } from "@/lib/content";

export function generateStaticParams() {
  return quests.map((q) => ({ id: q.id }));
}

export default async function QuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quest = quests.find((q) => q.id === id);
  if (!quest) notFound();
  return <QuestScreen quest={quest} />;
}
