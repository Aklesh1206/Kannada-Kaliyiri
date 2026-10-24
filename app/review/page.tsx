"use client";

import Link from "next/link";
import { useState } from "react";
import { LessonPlayer } from "@/components/LessonPlayer";
import { allPhrases } from "@/lib/content";
import { duePhraseIds, useHydrated, useProgress } from "@/lib/progress";

export default function ReviewPage() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="min-h-screen" aria-busy="true" />;
  return <Review />;
}

function Review() {
  const progress = useProgress();
  // Freeze the list when the page opens, so answering does not change the session mid-way
  const [due] = useState(() => {
    const ids = new Set(duePhraseIds(progress));
    return allPhrases.filter((p) => ids.has(p.id)).slice(0, 8);
  });

  if (due.length < 3) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="text-3xl font-bold">Nothing to review yet</h1>
        <p className="text-lg text-ink-soft">
          Finish a lesson and the phrases you learned will come back here when it is time to practise them again.
        </p>
        <Link
          href="/"
          className="press rounded-2xl bg-arishina px-8 py-4 text-lg font-bold text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)]"
        >
          Back to the path
        </Link>
      </div>
    );
  }

  return <LessonPlayer title="Review" lessonKey={null} phrases={due} pool={allPhrases} backHref="/" />;
}
