"use client";

import { rulesFor } from "@/lib/levels";
import type { Rules } from "@/lib/levels";
import { useProgress } from "@/lib/progress";

/** The rules for the learner's current level. Beginner until a level is chosen. */
export function useRules(): Rules {
  return rulesFor(useProgress().level);
}
