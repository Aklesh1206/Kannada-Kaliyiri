"use client";

import { useState } from "react";
import { cloudConfigured, deleteCloudData, getClient } from "@/lib/cloud";
import { setLeaderboard, setName, useHydrated, useProgress } from "@/lib/progress";
import { useSyncStatus } from "./CloudSync";
import { NeelaSays } from "./Neela";

export function AccountPanel() {
  const hydrated = useHydrated();
  const status = useSyncStatus();
  const p = useProgress();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!hydrated) return <div aria-busy="true" className="min-h-48" />;

  if (!cloudConfigured()) {
    return (
      <div className="flex flex-col gap-5">
        <NeelaSays mood="idle">
          Cloud save is not switched on for this copy of the app. Your progress is safe in this browser. To turn on sign-in,
          sync and the leaderboard, follow <span className="font-bold">supabase/SETUP.md</span>.
        </NeelaSays>
      </div>
    );
  }

  async function sendLink() {
    const c = getClient();
    if (!c || !email.trim()) return;
    setBusy(true);
    setMessage(null);
    const { error } = await c.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else setSent(true);
  }

  async function signOut() {
    await getClient()?.auth.signOut();
    setSent(false);
  }

  async function removeData() {
    const c = getClient();
    if (!c || !status.userId) return;
    if (!window.confirm("Delete your saved progress from the cloud? Progress on this device is kept.")) return;
    setBusy(true);
    try {
      await deleteCloudData(c, status.userId);
      await c.auth.signOut();
      setMessage("Your cloud data was deleted and you were signed out.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not delete your data");
    }
    setBusy(false);
  }

  const signedIn = status.state === "syncing" || status.state === "synced" || (status.state === "error" && status.userId);

  if (status.state === "loading") return <div aria-busy="true" className="min-h-48" />;

  return (
    <div className="flex flex-col gap-6">
      {!signedIn ? (
        <>
          <NeelaSays mood="happy">
            Sign in and I will remember your progress on every device, and you can join the leaderboard. No password needed:
            I email you a link.
          </NeelaSays>
          {sent ? (
            <p className="rounded-2xl bg-good-wash px-5 py-4 text-lg font-bold" role="status">
              Check your email and open the link. You will come right back here.
            </p>
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void sendLink();
              }}
            >
              <label className="flex flex-col gap-2">
                <span className="text-base font-semibold text-ink-soft">Your email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="rounded-2xl border-2 border-line bg-raised px-4 py-3 text-xl focus:border-arishina-deep focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="press self-start rounded-2xl bg-arishina px-8 py-4 text-lg font-bold text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)] disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft disabled:shadow-[0_4px_0_0_var(--line)]"
              >
                {busy ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          <NeelaSays mood={status.state === "error" ? "sad" : "cheer"}>
            {status.state === "error"
              ? "I could not reach the cloud just now. Your progress is safe here and I will try again."
              : status.state === "syncing"
                ? "Saving your progress…"
                : `Saved! You are signed in as ${status.email}.`}
          </NeelaSays>
          {status.error && <p className="text-kumkuma">{status.error}</p>}

          <label className="flex flex-col gap-2">
            <span className="text-base font-semibold text-ink-soft">Name on the leaderboard</span>
            <input
              value={p.name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border-2 border-line bg-raised px-4 py-3 text-xl font-bold focus:border-arishina-deep focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-3 text-lg font-semibold">
            <input
              type="checkbox"
              checked={p.leaderboard}
              onChange={(e) => setLeaderboard(e.target.checked)}
              className="h-6 w-6 accent-[#d99a00]"
            />
            Show my best scores on the leaderboard
          </label>
          <p className="text-sm text-ink-soft">The leaderboard shows only your name and score, never your email.</p>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={signOut} className="press rounded-2xl border-2 border-line px-6 py-3 text-lg font-bold">
              Sign out
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={removeData}
              className="press rounded-2xl border-2 border-kumkuma px-6 py-3 text-lg font-bold text-kumkuma"
            >
              Delete my cloud data
            </button>
          </div>
        </>
      )}
      {message && (
        <p className="text-base font-semibold text-kumkuma" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
