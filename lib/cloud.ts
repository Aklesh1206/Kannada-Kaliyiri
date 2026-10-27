"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fromRows, toRows } from "./merge";
import type { Snapshot } from "./merge";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null | undefined;

/** True when the two Supabase variables are set. When false, the app simply runs without cloud save. */
export function cloudConfigured(): boolean {
  return Boolean(URL_ && KEY);
}

export function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  client = URL_ && KEY ? createClient(URL_, KEY) : null;
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
  if (!c) return [];
  const res = await c
    .from("leaderboard")
    .select("display_name, score")
    .eq("game_key", gameKey)
    .order("score", { ascending: false })
    .limit(limit);
  return (must(res) as LeaderRow[] | null) ?? [];
}
