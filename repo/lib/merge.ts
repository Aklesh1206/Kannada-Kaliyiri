// Pure helpers for cloud save. No imports, so Node can run the tests directly.

export type Box = { box: number; due: string };

/** The part of the learner's progress that is saved in the cloud. */
export type Snapshot = {
  xp: number;
  streak: number;
  lastActive: string | null;
  completed: Record<string, number>;
  boxes: Record<string, Box>;
  highScores: Record<string, number>;
  level: string | null;
  name: string;
  leaderboard: boolean;
};

const LEVELS = ["beginner", "intermediate", "advanced"];

function betterBox(a: Box, b: Box): Box {
  if (a.box !== b.box) return a.box > b.box ? a : b;
  return a.due >= b.due ? a : b;
}

/**
 * Combines progress from this device with progress saved in the cloud, so signing in on a second
 * device never loses anything: counts take the larger value, review boxes keep the more advanced one,
 * and the streak comes from whichever side was active most recently.
 */
export function mergeProgress<T extends Snapshot>(local: T, remote: Snapshot | null): T {
  if (!remote) return local;

  const completed: Record<string, number> = { ...remote.completed };
  for (const [k, v] of Object.entries(local.completed)) completed[k] = Math.max(v, completed[k] ?? 0);

  const boxes: Record<string, Box> = { ...remote.boxes };
  for (const [id, b] of Object.entries(local.boxes)) boxes[id] = boxes[id] ? betterBox(b, boxes[id]) : b;

  const highScores: Record<string, number> = { ...remote.highScores };
  for (const [k, v] of Object.entries(local.highScores)) highScores[k] = Math.max(v, highScores[k] ?? 0);

  const newer = (local.lastActive ?? "") >= (remote.lastActive ?? "") ? local : remote;

  return {
    ...local,
    xp: Math.max(local.xp, remote.xp),
    streak: newer.streak,
    lastActive: newer.lastActive,
    completed,
    boxes,
    highScores,
    level: local.level ?? remote.level,
    name: local.name || remote.name,
    // Privacy first: if either side hid the learner from the leaderboard, stay hidden
    leaderboard: local.leaderboard && remote.leaderboard,
  };
}

export type CloudRows = {
  profile: {
    user_id: string;
    display_name: string | null;
    level: string | null;
    xp: number;
    streak: number;
    last_active: string | null;
    show_on_leaderboard: boolean;
  };
  lessons: { user_id: string; lesson_key: string; times: number }[];
  boxes: { user_id: string; phrase_id: string; box: number; due: string }[];
  scores: { user_id: string; game_key: string; score: number }[];
};

/** Turns progress into database rows. */
export function toRows(userId: string, p: Snapshot): CloudRows {
  return {
    profile: {
      user_id: userId,
      display_name: p.name.trim() ? p.name.trim().slice(0, 20) : null,
      level: p.level && LEVELS.includes(p.level) ? p.level : null,
      xp: Math.max(0, Math.round(p.xp)),
      streak: Math.max(0, Math.round(p.streak)),
      last_active: p.lastActive,
      show_on_leaderboard: p.leaderboard,
    },
    lessons: Object.entries(p.completed)
      .filter(([, times]) => times >= 1)
      .map(([lesson_key, times]) => ({ user_id: userId, lesson_key, times })),
    boxes: Object.entries(p.boxes).map(([phrase_id, b]) => ({
      user_id: userId,
      phrase_id,
      box: Math.min(5, Math.max(1, b.box)),
      due: b.due,
    })),
    scores: Object.entries(p.highScores)
      .filter(([, score]) => score >= 0)
      .map(([game_key, score]) => ({ user_id: userId, game_key, score: Math.round(score) })),
  };
}

type RowsIn = {
  profile: Partial<CloudRows["profile"]> | null;
  lessons: { lesson_key: string; times: number }[];
  boxes: { phrase_id: string; box: number; due: string }[];
  scores: { game_key: string; score: number }[];
};

/** Turns database rows back into progress. Returns null when the learner has nothing saved yet. */
export function fromRows(rows: RowsIn): Snapshot | null {
  const empty = !rows.profile && !rows.lessons.length && !rows.boxes.length && !rows.scores.length;
  if (empty) return null;
  const pr = rows.profile;
  return {
    xp: pr?.xp ?? 0,
    streak: pr?.streak ?? 0,
    lastActive: pr?.last_active ?? null,
    completed: Object.fromEntries(rows.lessons.map((l) => [l.lesson_key, l.times])),
    boxes: Object.fromEntries(rows.boxes.map((b) => [b.phrase_id, { box: b.box, due: b.due }])),
    highScores: Object.fromEntries(rows.scores.map((s) => [s.game_key, s.score])),
    level: pr?.level && LEVELS.includes(pr.level) ? pr.level : null,
    name: pr?.display_name ?? "",
    leaderboard: pr?.show_on_leaderboard ?? true,
  };
}
