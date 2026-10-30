"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fromRows, toRows } from "./merge";
import type { Snapshot } from "./merge";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null | undefined;

/**
 * Returns true if real Supabase credentials are configured (not dummy placeholder strings).
 */
export function isRealSupabase(): boolean {
  return Boolean(
    URL_ &&
    KEY &&
    !URL_.includes("YOUR-PROJECT") &&
    !KEY.includes("YOUR-ANON") &&
    URL_.startsWith("https://")
  );
}

/**
 * Returns true if cloud sync or test login accounts are enabled.
 * Always true so learners can test account features and sync locally out of the box.
 */
export function cloudConfigured(): boolean {
  return true;
}

export function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  client = isRealSupabase() && URL_ && KEY ? createClient(URL_, KEY) : null;
  return client;
}

function must<T>(res: { data: T | null; error: { message: string } | null }): T | null {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function pullRemote(c: SupabaseClient, userId: string): Promise<Snapshot | null> {
  const [profile, lessons, boxes, scores] = await Promise.all([
    c.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    c.from("completed_lessons").select("lesson_key, times").eq("user_id", userId),
    c.from("review_boxes").select("phrase_id, box, due").eq("user_id", userId),
    c.from("high_scores").select("game_key, score").eq("user_id", userId),
  ]);
  return fromRows({
    profile: must(profile),
    lessons: must(lessons) ?? [],
    boxes: must(boxes) ?? [],
    scores: must(scores) ?? [],
  });
}

export async function pushRemote(c: SupabaseClient, userId: string, p: Snapshot): Promise<void> {
  const rows = toRows(userId, p);
  const results = await Promise.all([
    c.from("profiles").upsert({ ...rows.profile, updated_at: new Date().toISOString() }),
    rows.lessons.length ? c.from("completed_lessons").upsert(rows.lessons) : null,
    rows.boxes.length ? c.from("review_boxes").upsert(rows.boxes) : null,
    rows.scores.length ? c.from("high_scores").upsert(rows.scores) : null,
  ]);
  for (const r of results) if (r?.error) throw new Error(r.error.message);
}

export async function deleteCloudData(c: SupabaseClient, userId: string): Promise<void> {
  const results = await Promise.all(
    ["completed_lessons", "review_boxes", "high_scores", "profiles"].map((t) => c.from(t).delete().eq("user_id", userId)),
  );
  for (const r of results) if (r.error) throw new Error(r.error.message);
}

export type LeaderRow = { display_name: string; score: number };

export async function fetchLeaderboard(gameKey: string, limit = 10): Promise<LeaderRow[]> {
  const c = getClient();
  if (c && isRealSupabase()) {
    try {
      const res = await c
        .from("leaderboard")
        .select("display_name, score")
        .eq("game_key", gameKey)
        .order("score", { ascending: false })
        .limit(limit);
      return (must(res) as LeaderRow[] | null) ?? [];
    } catch {
      // Fall through to sample leaderboard if query fails
    }
  }

  // Sample / Demo leaderboard rows when testing without cloud database
  const sampleLeaderboards: Record<string, LeaderRow[]> = {
    default: [
      { display_name: "Kavya R.", score: 520 },
      { display_name: "Praveen Kumar", score: 440 },
      { display_name: "Ananya B.", score: 390 },
      { display_name: "Test Learner (You)", score: 320 },
      { display_name: "Sneha", score: 280 },
      { display_name: "Arjun Gowda", score: 210 },
    ],
  };

  return sampleLeaderboards.default.slice(0, limit);
}
