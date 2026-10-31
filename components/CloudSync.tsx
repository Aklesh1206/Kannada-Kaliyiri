"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cloudConfigured, getClient, isRealSupabase, pullRemote, pushRemote } from "@/lib/cloud";
import { mergeProgress } from "@/lib/merge";
import { getProgress, replaceProgress, setPersistence, useProgress } from "@/lib/progress";
import type { Progress } from "@/lib/progress";

export const TEST_USER_STORAGE = "kk:test_user";

export type TestUser = {
  id: string;
  email: string;
  name: string;
  isTest?: boolean;
};

export type SyncStatus = {
  state: "off" | "loading" | "signedout" | "syncing" | "synced" | "error";
  email: string | null;
  userId: string | null;
  at: number | null;
  error: string | null;
  isTestUser?: boolean;
};

export function getStoredTestUser(): TestUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TEST_USER_STORAGE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const INITIAL: SyncStatus = {
  state: cloudConfigured() ? "loading" : "off",
  email: null,
  userId: null,
  at: null,
  error: null,
  isTestUser: false,
};

let status: SyncStatus = INITIAL;
const listeners = new Set<() => void>();

export function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  listeners.forEach((l) => l());
}

export function setStoredTestUser(user: TestUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(TEST_USER_STORAGE, JSON.stringify(user));
    setPersistence(true);
    setStatus({
      state: "synced",
      userId: user.id,
      email: user.email,
      at: Date.now(),
      error: null,
      isTestUser: true,
    });
  } else {
    localStorage.removeItem(TEST_USER_STORAGE);
    setPersistence(false);
    setStatus({
      state: "signedout",
      userId: null,
      email: null,
      at: null,
      error: null,
      isTestUser: false,
    });
  }
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
  setPersistence(true); // signed in: from here on progress is saved (what the guest did so far is kept)
  setStatus({ state: "syncing", userId, email, error: null, isTestUser: false });
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
    // Check if user has an active test login session
    const localUser = getStoredTestUser();
    if (localUser) {
      setStatus({
        state: "synced",
        userId: localUser.id,
        email: localUser.email,
        at: Date.now(),
        error: null,
        isTestUser: true,
      });
      return;
    }

    const c = getClient();
    if (!c || !isRealSupabase()) {
      setStatus({ state: "signedout", isTestUser: false });
      return;
    }

    const { data } = c.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void firstSync(session.user.id, session.user.email ?? null);
      } else {
        activeUser = null;
        if (!getStoredTestUser()) {
          setPersistence(false);
          setStatus({ state: "signedout", userId: null, email: null, error: null, isTestUser: false });
        }
      }
    });

    void c.auth.getSession().then(({ data: s }) => {
      if (!s.session && !getStoredTestUser()) {
        setStatus({ state: "signedout", isTestUser: false });
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const c = getClient();
    const userId = activeUser;
    if (!c || !userId || !isRealSupabase() || fingerprint(progress) === lastFingerprint) return;
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
