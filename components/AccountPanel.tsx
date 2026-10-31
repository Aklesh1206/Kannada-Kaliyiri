"use client";

import { useState } from "react";
import { deleteCloudData, getClient, isRealSupabase } from "@/lib/cloud";
import { setLeaderboard, setName, useHydrated, useProgress } from "@/lib/progress";
import { setStoredTestUser, useSyncStatus } from "./CloudSync";
import { NeelaSays } from "./Neela";

const TEST_CREDENTIALS = {
  email: "test@kannada.com",
  password: "password123",
  name: "Test Learner",
};

function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) {
    return "Wrong email or password. If you just created this account, confirm the email we sent first. If you first used Magic Link with this email, that account has no password yet: sign in with Magic Link.";
  }
  if (m.includes("not confirmed")) return "Please confirm your email first: open the message we sent and click the link, then sign in.";
  if (m.includes("rate limit")) return "Too many attempts. Wait a minute and try again.";
  return msg;
}

type AuthMode = "signin" | "signup" | "otp";

export function AccountPanel() {
  const hydrated = useHydrated();
  const status = useSyncStatus();
  const p = useProgress();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [sentOtp, setSentOtp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!hydrated) return <div aria-busy="true" className="min-h-48" />;

  const isReal = isRealSupabase();
  const signedIn =
    status.state === "syncing" ||
    status.state === "synced" ||
    status.isTestUser ||
    (status.state === "error" && Boolean(status.userId));

  function fillTestCredentials() {
    setEmail(TEST_CREDENTIALS.email);
    setPassword(TEST_CREDENTIALS.password);
    setDisplayName(TEST_CREDENTIALS.name);
    setMessage(null);
  }

  function handleQuickTestLogin() {
    setBusy(true);
    setMessage(null);
    setSuccessMsg(null);

    setTimeout(() => {
      setStoredTestUser({
        id: "test-user-kannada-001",
        email: TEST_CREDENTIALS.email,
        name: p.name || TEST_CREDENTIALS.name,
        isTest: true,
      });
      if (!p.name) setName(TEST_CREDENTIALS.name);
      setBusy(false);
      setSuccessMsg("Signed in successfully with Test Account!");
    }, 250);
  }

  async function handlePasswordAuth(isSignUp: boolean) {
    if (!email.trim() || !password.trim()) {
      setMessage("Please enter both email and password.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    setMessage(null);
    setSuccessMsg(null);

    // If real Supabase is configured, use Supabase Auth
    if (isReal) {
      const c = getClient();
      if (!c) return;

      if (isSignUp) {
        const { data, error } = await c.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: { display_name: displayName.trim() || email.split("@")[0] },
          },
        });
        setBusy(false);
        if (error) {
          setMessage(friendlyAuthError(error.message));
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
          // Supabase answers "success" for an email that already exists, without creating anything
          setMessage("This email already has an account. Use Sign In with your password, or the Magic Link tab if you signed up that way.");
        } else if (data.session) {
          if (displayName.trim()) setName(displayName.trim());
          setSuccessMsg("Account created and signed in!");
        } else {
          setSuccessMsg("Account created! We sent a confirmation email: open it, click the link, then come back and sign in.");
        }
      } else {
        const { data, error } = await c.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        setBusy(false);
        if (error) {
          setMessage(friendlyAuthError(error.message));
        } else if (data.user) {
          setSuccessMsg("Signed in successfully!");
        }
      }
      return;
    }

    // Local Test Mode (no Supabase project needed)
    setTimeout(() => {
      const chosenName = displayName.trim() || p.name || email.split("@")[0];
      setStoredTestUser({
        id: `test-user-${Date.now()}`,
        email: email.trim(),
        name: chosenName,
        isTest: true,
      });
      setName(chosenName);
      setBusy(false);
      setSuccessMsg(isSignUp ? "Test account created & signed in!" : "Signed in successfully!");
    }, 300);
  }

  async function sendMagicLink() {
    const c = getClient();
    if (!email.trim()) return;
    setBusy(true);
    setMessage(null);

    if (isReal && c) {
      const { error } = await c.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/account` },
      });
      setBusy(false);
      if (error) setMessage(error.message);
      else setSentOtp(true);
    } else {
      // Local demo fallback for magic link
      setTimeout(() => {
        setBusy(false);
        setSentOtp(true);
      }, 400);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      const c = getClient();
      if (c && isReal) await c.auth.signOut();
      setStoredTestUser(null);
      setSentOtp(false);
      setMessage(null);
      setSuccessMsg("Signed out.");
    } finally {
      setBusy(false);
    }
  }

  async function removeData() {
    const c = getClient();
    if (!window.confirm("Delete your saved progress from the cloud? Progress on this device is kept.")) return;
    setBusy(true);
    try {
      if (c && isReal && status.userId) {
        await deleteCloudData(c, status.userId);
        await c.auth.signOut();
      }
      setStoredTestUser(null);
      setMessage("Account data removed and you were signed out.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not delete your data");
    } finally {
      setBusy(false);
    }
  }

  if (status.state === "loading") return <div aria-busy="true" className="min-h-48" />;

  return (
    <div className="flex flex-col gap-6">
      {!signedIn ? (
        <>
          <NeelaSays mood="happy">
            You are playing as a guest, so nothing is saved: your progress is gone when you reload. Sign in or create an
            account to save your progress, keep your streak across devices, and join the leaderboard!
          </NeelaSays>

          {/* Preset Test Credentials Card */}
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-arishina-deep bg-arishina-wash p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-arishina-deep">
                <span>🧪</span>
                <span>Preset Test Credentials</span>
              </span>
              <span className="rounded-full bg-arishina px-2.5 py-0.5 text-xs font-bold text-[#1c1b3a]">
                Ready to Use
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
              <div className="rounded-xl border border-arishina-deep/30 bg-paper p-2.5">
                <span className="block text-xs font-semibold text-ink-soft">Test Email:</span>
                <code className="font-bold text-ink select-all">{TEST_CREDENTIALS.email}</code>
              </div>
              <div className="rounded-xl border border-arishina-deep/30 bg-paper p-2.5">
                <span className="block text-xs font-semibold text-ink-soft">Test Password:</span>
                <code className="font-bold text-ink select-all">{TEST_CREDENTIALS.password}</code>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleQuickTestLogin}
                disabled={busy}
                className="press rounded-xl bg-arishina px-4 py-2 text-sm font-bold text-[#1c1b3a] shadow-[0_3px_0_0_var(--arishina-deep)] hover:bg-arishina"
              >
                ⚡ 1-Click Test Sign In
              </button>
              <button
                type="button"
                onClick={fillTestCredentials}
                className="press rounded-xl border-2 border-line bg-paper px-3 py-2 text-sm font-bold text-ink hover:border-arishina-deep"
              >
                Auto-fill Form
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-line p-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              onClick={() => {
                setMode("signin");
                setMessage(null);
              }}
              className={`flex-1 rounded-lg py-2.5 text-base font-bold transition ${
                mode === "signin" ? "bg-paper text-ink shadow" : "text-ink-soft hover:text-ink"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => {
                setMode("signup");
                setMessage(null);
              }}
              className={`flex-1 rounded-lg py-2.5 text-base font-bold transition ${
                mode === "signup" ? "bg-paper text-ink shadow" : "text-ink-soft hover:text-ink"
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "otp"}
              onClick={() => {
                setMode("otp");
                setMessage(null);
              }}
              className={`flex-1 rounded-lg py-2.5 text-base font-bold transition ${
                mode === "otp" ? "bg-paper text-ink shadow" : "text-ink-soft hover:text-ink"
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Sign In & Sign Up Form */}
          {mode !== "otp" ? (
            <form
              className="flex flex-col gap-4 rounded-2xl border-2 border-line bg-paper p-5 shadow-xs"
              onSubmit={(e) => {
                e.preventDefault();
                void handlePasswordAuth(mode === "signup");
              }}
            >
              <h2 className="text-xl font-bold">
                {mode === "signup" ? "Create a New Learner Account" : "Sign In to Your Account"}
              </h2>

              {mode === "signup" && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-ink-soft">Your Name</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Arun Kumar"
                    maxLength={20}
                    className="rounded-xl border-2 border-line bg-raised px-3.5 py-2.5 text-base focus:border-arishina-deep focus:outline-none"
                  />
                </label>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink-soft">Email Address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="rounded-xl border-2 border-line bg-raised px-3.5 py-2.5 text-base focus:border-arishina-deep focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-soft">Password</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-semibold text-ink-soft hover:text-ink"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={6}
                  className="rounded-xl border-2 border-line bg-raised px-3.5 py-2.5 text-base focus:border-arishina-deep focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={busy || !email.trim() || !password.trim()}
                className="press mt-2 rounded-xl bg-arishina px-6 py-3.5 text-lg font-bold text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)] disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft disabled:shadow-none"
              >
                {busy
                  ? "Processing…"
                  : mode === "signup"
                    ? "Create Account"
                    : "Sign In"}
              </button>
            </form>
          ) : (
            /* Magic Link Form */
            <div className="rounded-2xl border-2 border-line bg-paper p-5 shadow-xs">
              <h2 className="mb-2 text-xl font-bold">Email a Magic Sign-In Link</h2>
              <p className="mb-4 text-sm text-ink-soft">
                Enter your email address and we will send you a password-free sign in link.
              </p>

              {sentOtp ? (
                <p className="rounded-xl bg-good-wash p-4 text-base font-bold text-good" role="status">
                  Check your email! Open the sign-in link to return here logged in.
                </p>
              ) : (
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendMagicLink();
                  }}
                >
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-ink-soft">Your email</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="rounded-xl border-2 border-line bg-raised px-3.5 py-2.5 text-base focus:border-arishina-deep focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy || !email.trim()}
                    className="press self-start rounded-xl bg-arishina px-6 py-3 text-base font-bold text-[#1c1b3a] shadow-[0_3px_0_0_var(--arishina-deep)] disabled:bg-line disabled:text-ink-soft disabled:shadow-none"
                  >
                    {busy ? "Sending…" : "Email me a sign-in link"}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      ) : (
        /* Signed In Dashboard View */
        <>
          <NeelaSays mood={status.state === "error" ? "sad" : "cheer"}>
            {status.state === "error"
              ? "I could not reach the cloud just now. Your progress is safe locally."
              : `Saved! You are signed in as ${status.email}.`}
          </NeelaSays>

          {/* Account status badge */}
          <div className="flex items-center justify-between rounded-2xl border-2 border-good/40 bg-good-wash px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-good">Active Session</span>
                <span className="block text-sm font-bold text-ink">{status.email}</span>
              </div>
            </div>
            <span className="rounded-full bg-good/20 px-3 py-1 text-xs font-bold text-good">
              {status.isTestUser ? "🧪 Test Account" : "☁️ Cloud Synced"}
            </span>
          </div>

          {status.error && <p className="text-sm font-semibold text-kumkuma">{status.error}</p>}

          {/* Profile & Leaderboard Settings */}
          <div className="flex flex-col gap-4 rounded-2xl border-2 border-line bg-paper p-5 shadow-xs">
            <h3 className="text-lg font-bold">Learner Profile</h3>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink-soft">Display Name on Leaderboard</span>
              <input
                value={p.name}
                maxLength={20}
                placeholder="Enter your name"
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-2 border-line bg-raised px-3.5 py-2.5 text-base font-bold focus:border-arishina-deep focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-3 text-base font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={p.leaderboard}
                onChange={(e) => setLeaderboard(e.target.checked)}
                className="h-5 w-5 accent-arishina-deep"
              />
              Show my best scores on the public leaderboard
            </label>
            <p className="text-xs text-ink-soft">
              The leaderboard shows only your nickname and scores, never your email address or password.
            </p>
          </div>

          {/* Learner Stats Overview */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-line bg-raised p-3">
              <span className="block text-xs font-semibold text-ink-soft">Total XP</span>
              <span className="text-xl font-black text-ink">{p.xp}</span>
            </div>
            <div className="rounded-2xl border border-line bg-raised p-3">
              <span className="block text-xs font-semibold text-ink-soft">Day Streak</span>
              <span className="text-xl font-black text-kumkuma">{p.streak} 🔥</span>
            </div>
            <div className="rounded-2xl border border-line bg-raised p-3">
              <span className="block text-xs font-semibold text-ink-soft">Hearts</span>
              <span className="text-xl font-black text-good">{p.hearts}/5 ❤️</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={signOut}
              disabled={busy}
              className="press rounded-2xl border-2 border-line bg-paper px-6 py-3 text-base font-bold text-ink hover:border-line/80"
            >
              Sign out
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={removeData}
              className="press rounded-2xl border-2 border-kumkuma bg-kumkuma-wash px-5 py-3 text-base font-bold text-kumkuma"
            >
              Delete account data
            </button>
          </div>
        </>
      )}

      {message && (
        <p className="rounded-xl bg-kumkuma-wash p-3.5 text-center text-sm font-semibold text-kumkuma" role="alert">
          {message}
        </p>
      )}

      {successMsg && (
        <p className="rounded-xl bg-good-wash p-3.5 text-center text-sm font-semibold text-good" role="status">
          {successMsg}
        </p>
      )}
    </div>
  );
}
