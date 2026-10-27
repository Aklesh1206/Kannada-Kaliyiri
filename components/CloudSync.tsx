"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cloudConfigured, getClient, pullRemote, pushRemote } from "@/lib/cloud";
import { mergeProgress } from "@/lib/merge";
import { getProgress, replaceProgress, useProgress } from "@/lib/progress";
import type { Progress } from "@/lib/progress";

export type SyncStatus = {
  state: "off" | "loading" | "signedout" | "syncing" | "synced" | "error";
  email: string | null;
  userId: string | null;
  at: number | null;
  error: string | null;
};

const INITIAL: SyncStatus = {
  state: cloudConfigured() ? "loading" : "off",
  email: null,
  userId: null,
  at: null,
  error: null,
};

let status: SyncStatus = INITIAL;
const listeners = new Set<() => void>();
function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  listeners.forEach((l) => l());
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => status,
    () => INITIAL,
  );
}

let activeUser: string | null = null;
let syncing: string | null = null;
let lastFingerprint = "";

/** Only the fields that live in the cloud, so heart changes do not trigger uploads. */
function fingerprint(p: Progress): string {
  return JSON.stringify([p.xp, p.streak, p.lastActive, p.completed, p.boxes, p.highScores, p.level, p.name, p.leaderboard]);
}

async function firstSync(userId: string, email: string | null) {
  const c = getClient();
  if (!c || syncing === userId || activeUser === userId) return;
  syncing = userId;
  setStatus({ state: "syncing", userId, email, error: null });
  try {
    const remote = await pullRemote(c, userId);
    const merged = mergeProgress(getProgress(), remote);
    replaceProgress(merged);
    await pushRemote(c, userId, merged);
    activeUser = userId;
    lastFingerprint = fingerprint(merged);
    setStatus({ state: "synced", at: Date.now() });
  } catch (e) {
    setStatus({ state: "error", error: e instanceof Error ? e.message : "Could not sync" });
  } finally {
    syncing = null;
  }
}

/** Keeps progress in step with the cloud while a learner is signed in. Renders nothing. */
export function CloudSync() {
  const progress = useProgress();

  useEffect(() => {
    const c = getClient();
    if (!c) return;
    const { data } = c.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void firstSync(session.user.id, session.user.email ?? null);
      } else {
        activeUser = null;
        setStatus({ state: "signedout", userId: null, email: null, error: null });
      }
    });
    void c.auth.getSession().then(({ data: s }) => {
      if (!s.session) setStatus({ state: "signedout" });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const c = getClient();
    const userId = activeUser;
    if (!c || !userId || fingerprint(progress) === lastFingerprint) return;
    const t = setTimeout(async () => {
      try {
        setStatus({ state: "syncing" });
        await pushRemote(c, userId, progress);
        lastFingerprint = fingerprint(progress);
        setStatus({ state: "synced", at: Date.now(), error: null });
      } catch (e) {
        setStatus({ state: "error", error: e instanceof Error ? e.message : "Could not sync" });
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [progress]);

  return null;
}
