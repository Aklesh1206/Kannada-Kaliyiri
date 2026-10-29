"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { playPhrase } from "@/lib/audio";
import { unitsForLevel } from "@/lib/content";
import { pickPool } from "@/lib/games";
import type { NeelaReply, SuggestedReply } from "@/lib/neelaAI";
import { SCENARIO_LIST, getOfflineReply } from "@/lib/offlineDialogues";
import { completeLesson, useHydrated, useProgress } from "@/lib/progress";
import { bestReport, coachingLine } from "@/lib/pronounce";
import type { PronounceReport, WordStatus } from "@/lib/pronounce";
import { listenOnce, speechErrorMessage, speechSupported, SpeechError } from "@/lib/speech";
import { LevelPills } from "../LevelPills";
import { Neela, NeelaSays } from "../Neela";
import type { Mood } from "../Neela";
import { SpeakerButton } from "../SpeakerButton";

type Target = { id: string; kn: string; tr: string; en: string };
type ChatMsg = { role: "user"; text: string } | ({ role: "neela" } & NeelaReply);
type Mode = "practice" | "chat";

export function TalkScreen() {
  const hydrated = useHydrated();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-24">
      <header className="flex items-center gap-4 py-4">
        <Link href="/" aria-label="Back to the path" className="grid h-10 w-10 place-items-center rounded-full text-2xl text-ink-soft hover:bg-line/60">
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">Talk with Neela</h1>
      </header>
      {hydrated ? <Talk /> : <div aria-busy="true" className="min-h-64" />}
    </div>
  );
}

function Talk() {
  const p = useProgress();
  const level = p.level ?? "beginner";
  const pool = useMemo(() => pickPool(unitsForLevel(level), p.completed), [level, p.completed]);
  return <TalkInner key={level} pool={pool} level={level} name={p.name} />;
}

function randomTarget(pool: Target[], avoid?: string): Target {
  const options = pool.filter((x) => x.id !== avoid);
  const list = options.length ? options : pool;
  return list[Math.floor(Math.random() * list.length)];
}

function TalkInner({ pool, level, name }: { pool: Target[]; level: string; name: string }) {
  const supported = speechSupported();
  const [mode, setMode] = useState<Mode>("practice");
  const [ai, setAi] = useState<"unknown" | "on" | "off">("unknown");
  const stop = useRef<(() => void) | null>(null);
  const awarded = useRef(new Set<string>());
  const awardedScenario = useRef(new Set<string>());

  // practice
  const [target, setTarget] = useState<Target>(() => randomTarget(pool));
  const [listening, setListening] = useState(false);
  const [report, setReport] = useState<PronounceReport | null>(null);
  const [heardRaw, setHeardRaw] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // chat
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lang, setLang] = useState<"kn-IN" | "en-IN">("kn-IN");
  const [input, setInput] = useState("");
  const [scenario, setScenario] = useState("auto-ride");
  const [autoVoice, setAutoVoice] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/neela")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => {
        if (cancelled) return;
        const isOn = Boolean(d.configured);
        setAi(isOn ? "on" : "off");
      })
      .catch(() => {
        if (!cancelled) setAi("off");
      });
    return () => {
      cancelled = true;
      stop.current?.();
    };
  }, []);

  function startScenario(scenId: string, isAiOn: boolean) {
    setScenario(scenId);
    setChatError(null);
    setInput("");
    if (isAiOn) {
      setChat([]);
      void ask([], scenId);
    } else {
      const greeting = getOfflineReply(scenId, 0);
      setChat([{ role: "neela", ...greeting }]);
      if (autoVoice && greeting.reply?.kn) {
        playPhrase(`neela-${Date.now()}`, greeting.reply.kn);
      }
    }
  }

  function nextTarget() {
    setTarget(randomTarget(pool, target.id));
    setReport(null);
    setHeardRaw(null);
    setProblem(null);
  }

  function speakPractice() {
    setProblem(null);
    setReport(null);
    setHeardRaw(null);
    setListening(true);
    const s = listenOnce("kn-IN");
    stop.current = s.stop;
    s.result
      .then((alts) => {
        setListening(false);
        const r = bestReport(alts, target.kn);
        if (!r) {
          setHeardRaw(alts[0] ?? "");
          setProblem("I heard English letters, not Kannada. Tap the microphone and say the phrase in Kannada.");
          return;
        }
        setReport(r);
        if (r.verdict === "great" && !awarded.current.has(target.id)) {
          awarded.current.add(target.id);
          completeLesson(null, 2);
        }
      })
      .catch((e: unknown) => {
        setListening(false);
        setProblem(speechErrorMessage(e instanceof SpeechError ? e.code : "other"));
      });
  }

  function handleOfflineFallback(history: ChatMsg[], currentScenario = scenario) {
    const userTurnCount = history.filter((m) => m.role === "user").length;
    const lastMsg = history[history.length - 1];
    const lastUserText = lastMsg && lastMsg.role === "user" ? lastMsg.text : undefined;
    const fallback = getOfflineReply(currentScenario, userTurnCount, lastUserText);
    if (fallback.completed && !awardedScenario.current.has(currentScenario)) {
      awardedScenario.current.add(currentScenario);
      completeLesson(null, 15);
    }
    if (autoVoice && fallback.reply?.kn) {
      playPhrase(`offline-${Date.now()}`, fallback.reply.kn);
    }
    setChat([...history, { role: "neela", ...fallback }]);
  }

  async function ask(history: ChatMsg[], currentScenario = scenario) {
    setBusy(true);
    setChatError(null);
    try {
      const res = await fetch("/api/neela", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) =>
            m.role === "user" ? { role: "user", text: m.text } : { role: "neela", text: `${m.reply.kn} (${m.reply.en})` },
          ),
          level,
          name,
          scenario: currentScenario,
          known: pool.slice(0, 25).map(({ kn, tr, en }) => ({ kn, tr, en })),
        }),
      });

      if (res.status === 503) {
        setAi("off");
        handleOfflineFallback(history, currentScenario);
        return;
      }
      if (res.status === 429) {
        setChatError("Neela needs a little rest. Try again in a few minutes.");
        return;
      }
      if (!res.ok) {
        handleOfflineFallback(history, currentScenario);
        return;
      }
      const data = (await res.json()) as NeelaReply;
      if (data.completed && !awardedScenario.current.has(currentScenario)) {
        awardedScenario.current.add(currentScenario);
        completeLesson(null, 15);
      }
      if (autoVoice && data.reply?.kn) {
        playPhrase(`ai-${Date.now()}`, data.reply.kn);
      }
      setChat([...history, { role: "neela", ...data }]);
    } catch {
      handleOfflineFallback(history, currentScenario);
    } finally {
      setBusy(false);
    }
  }

  function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput("");
    const history: ChatMsg[] = [...chat, { role: "user", text: clean }];
    setChat(history);

    if (ai === "on") {
      void ask(history);
    } else {
      setBusy(true);
      setTimeout(() => {
        const userTurnCount = history.filter((m) => m.role === "user").length;
        const offlineReply = getOfflineReply(scenario, userTurnCount, clean);
        if (offlineReply.completed && !awardedScenario.current.has(scenario)) {
          awardedScenario.current.add(scenario);
          completeLesson(null, 15);
        }
        if (autoVoice && offlineReply.reply?.kn) {
          playPhrase(`offline-${Date.now()}`, offlineReply.reply.kn);
        }
        setChat([...history, { role: "neela", ...offlineReply }]);
        setBusy(false);
      }, 350);
    }
  }

  function talkChat() {
    setChatError(null);
    setListening(true);
    const s = listenOnce(lang);
    stop.current = s.stop;
    s.result
      .then((alts) => {
        setListening(false);
        if (alts[0]) send(alts[0]);
      })
      .catch((e: unknown) => {
        setListening(false);
        setChatError(speechErrorMessage(e instanceof SpeechError ? e.code : "other"));
      });
  }

  function openChat() {
    setMode("chat");
    if (chat.length === 0 && !busy) {
      startScenario(scenario, ai === "on");
    }
  }

  function practiceCorrection(c: { kn: string; tr: string; en: string }) {
    setTarget({ id: `ai-${Date.now()}`, kn: c.kn, tr: c.tr, en: c.en });
    setReport(null);
    setHeardRaw(null);
    setProblem(null);
    setMode("practice");
  }

  const mood: Mood = listening
    ? "happy"
    : mode === "practice" && report
      ? report.verdict === "great"
        ? "cheer"
        : report.verdict === "close"
          ? "happy"
          : "sad"
      : chat.length > 0 && chat[chat.length - 1].role === "neela" && (chat[chat.length - 1] as NeelaReply).completed
        ? "cheer"
        : "idle";

  return (
    <main className="flex flex-1 flex-col gap-5">
      <div role="radiogroup" aria-label="Mode" className="flex gap-1 rounded-2xl bg-line p-1">
        {(
          [
            ["practice", "Pronunciation practice"],
            ["chat", "Chat with Neela"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mode === id}
            onClick={() => (id === "chat" ? openChat() : setMode("practice"))}
            className={`flex-1 rounded-xl px-2 py-2 text-base font-bold ${mode === id ? "bg-paper text-ink shadow" : "text-ink-soft"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <LevelPills />

      {!supported && (
        <p className="rounded-2xl bg-kumkuma-wash px-4 py-3 text-base font-semibold" role="status">
          This browser cannot listen to speech. Chrome or Edge works. You can still chat by typing.
        </p>
      )}

      {mode === "practice" ? (
        <Practice
          target={target}
          mood={mood}
          listening={listening}
          report={report}
          heardRaw={heardRaw}
          problem={problem}
          supported={supported}
          onSpeak={speakPractice}
          onNext={nextTarget}
          onAgain={() => {
            setReport(null);
            setProblem(null);
            setHeardRaw(null);
          }}
        />
      ) : (
        <Chat
          chat={chat}
          busy={busy}
          error={chatError}
          listening={listening}
          supported={supported}
          lang={lang}
          setLang={setLang}
          scenario={scenario}
          setScenario={(s) => startScenario(s, ai === "on")}
          input={input}
          setInput={setInput}
          onSend={() => send(input)}
          onSelectSuggestion={(sug) => send(sug.kn)}
          onTalk={talkChat}
          onPractice={practiceCorrection}
          onRestartScenario={() => startScenario(scenario, ai === "on")}
          aiMode={ai}
          autoVoice={autoVoice}
          setAutoVoice={setAutoVoice}
        />
      )}

      <p className="text-center text-sm text-ink-soft">
        Speech is turned into text by your browser&apos;s speech service. Chat messages go to Neela&apos;s AI tutor. No audio is
        stored by this app.
      </p>
    </main>
  );
}

const CHIP: Record<WordStatus, string> = {
  ok: "border-good bg-good-wash",
  close: "border-arishina-deep bg-arishina-wash",
  wrong: "border-kumkuma bg-kumkuma-wash",
  missing: "border-line bg-line/40 opacity-70",
};
const CHIP_LABEL: Record<WordStatus, string> = { ok: "Good", close: "Close", wrong: "Off", missing: "Not heard" };

function Practice(props: {
  target: Target;
  mood: Mood;
  listening: boolean;
  report: PronounceReport | null;
  heardRaw: string | null;
  problem: string | null;
  supported: boolean;
  onSpeak: () => void;
  onNext: () => void;
  onAgain: () => void;
}) {
  const { target, report, listening } = props;
  return (
    <>
      <NeelaSays mood={props.mood}>
        {listening
          ? "I am listening…"
          : report
            ? coachingLine(report)
            : props.problem
              ? props.problem
              : "Hear me say it first, then tap the microphone and say it back."}
      </NeelaSays>

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-arishina-wash px-5 py-6 text-center">
        <p className="kn text-4xl font-bold">{target.kn}</p>
        <p className="text-xl font-bold text-kumkuma">{target.tr}</p>
        <p className="text-lg font-semibold">{target.en}</p>
        <div className="flex items-center gap-3">
          <SpeakerButton phraseId={target.id} kn={target.kn} label="Hear it" />
          <span className="text-sm text-ink-soft">Listen first</span>
        </div>
      </div>

      <button
        type="button"
        onClick={props.onSpeak}
        disabled={listening || !props.supported}
        aria-label={listening ? "Listening" : "Start speaking"}
        className={`press mx-auto grid h-24 w-24 place-items-center rounded-full text-white shadow-[0_5px_0_0_var(--kumkuma-deep)] disabled:cursor-not-allowed ${
          listening ? "bg-kumkuma-deep" : "bg-kumkuma"
        } ${!props.supported ? "opacity-50" : ""}`}
      >
        <MicIcon />
      </button>

      {props.heardRaw !== null && props.problem && (
        <p className="text-center text-ink-soft">
          Heard: <span className="font-semibold text-ink">{props.heardRaw || "nothing"}</span>
        </p>
      )}

      {report && (
        <section aria-label="Word by word" className="flex flex-col gap-3">
          <p className="text-center text-sm font-semibold text-ink-soft">
            I heard: <span className="kn text-base font-bold text-ink">{report.heard}</span>
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {report.words.map((w, i) => (
              <li key={i} className={`rounded-xl border-2 px-3 py-2 text-center ${CHIP[w.status]}`}>
                <span className="kn block text-xl font-bold">{w.expected}</span>
                <span className="block text-xs font-semibold">
                  {CHIP_LABEL[w.status]}
                  {w.heard && w.heard !== w.expected ? ` · heard ${w.heard}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-center gap-3">
            <button type="button" onClick={props.onAgain} className="press rounded-2xl border-2 border-line px-6 py-3 text-lg font-bold">
              Try again
            </button>
            <button
              type="button"
              onClick={props.onNext}
              className="press rounded-2xl bg-arishina px-6 py-3 text-lg font-bold text-[#1c1b3a] shadow-[0_4px_0_0_var(--arishina-deep)]"
            >
              Next phrase
            </button>
          </div>
          <p className="text-center text-sm text-ink-soft">
            Kannada speech recognition is not perfect. Treat this as a guide, not a grade.
          </p>
        </section>
      )}

      {!report && !listening && (
        <button type="button" onClick={props.onNext} className="self-center text-base font-semibold text-ink-soft underline">
          Different phrase
        </button>
      )}
    </>
  );
}

function Chat(props: {
  chat: ChatMsg[];
  busy: boolean;
  error: string | null;
  listening: boolean;
  supported: boolean;
  lang: "kn-IN" | "en-IN";
  setLang: (l: "kn-IN" | "en-IN") => void;
  scenario: string;
  setScenario: (s: string) => void;
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
  onSelectSuggestion: (s: SuggestedReply) => void;
  onTalk: () => void;
  onPractice: (c: { kn: string; tr: string; en: string }) => void;
  onRestartScenario: () => void;
  aiMode: "on" | "off" | "unknown";
  autoVoice: boolean;
  setAutoVoice: (v: boolean) => void;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [props.chat.length, props.busy]);

  const activeScenario = SCENARIO_LIST.find((s) => s.id === props.scenario) ?? SCENARIO_LIST[0];

  return (
    <>
      {/* Scenario Selector Tabs */}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Scenario">
        {SCENARIO_LIST.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={props.scenario === s.id}
            onClick={() => props.scenario !== s.id && props.setScenario(s.id)}
            className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-bold transition ${
              props.scenario === s.id ? "border-arishina-deep bg-arishina-wash text-ink shadow-xs" : "border-line bg-paper text-ink-soft hover:border-line/80"
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Scenario Mission Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-arishina-deep/40 bg-arishina-wash/70 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0" aria-hidden="true">
            {activeScenario.icon}
          </span>
          <div className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-arishina-deep">
              One-on-One Training Mission
            </span>
            <span className="block text-sm font-bold text-ink truncate sm:whitespace-normal">
              {activeScenario.mission}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              props.aiMode === "on" ? "bg-good/20 text-good" : "bg-ink/10 text-ink-soft"
            }`}
            title={props.aiMode === "on" ? "Connected to Cloud AI model" : "Interactive guided practice dialogue"}
          >
            {props.aiMode === "on" ? "🟢 Live AI" : "💡 Guided"}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <ol className="flex flex-col gap-4" aria-live="polite">
        {props.chat.map((m, i) => {
          const isLatest = i === props.chat.length - 1;
          if (m.role === "user") {
            return (
              <li key={i} className="self-end rounded-2xl rounded-br-sm bg-arishina px-4 py-3 text-lg font-semibold text-[#1c1b3a] shadow-xs max-w-[85%]">
                {m.text}
              </li>
            );
          }

          return (
            <li key={i} className="flex flex-col gap-3 max-w-[95%]">
              <NeelaSays mood={m.completed ? "cheer" : "happy"} size={64}>
                <span className="kn block text-2xl font-bold leading-relaxed">{m.reply.kn}</span>
                <span className="block font-semibold text-kumkuma">{m.reply.tr}</span>
                <span className="block text-ink-soft">{m.reply.en}</span>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <SpeakerButton phraseId={`ai-reply-${i}`} kn={m.reply.kn} label="Hear Neela" />
                  <button
                    type="button"
                    onClick={() => props.onPractice(m.reply)}
                    className="press rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-bold text-ink-soft hover:text-ink"
                  >
                    🎤 Practice saying this
                  </button>
                </div>
              </NeelaSays>

              {/* Gentle Correction Box */}
              {m.correction && (
                <div className="ml-4 rounded-2xl border-2 border-arishina-deep bg-arishina-wash px-4 py-3 shadow-xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-arishina-deep">
                    Neela&apos;s Coaching · A better way to say it
                  </p>
                  <p className="kn mt-1 text-xl font-bold">{m.correction.kn}</p>
                  <p className="font-semibold text-kumkuma">{m.correction.tr}</p>
                  <p className="text-ink-soft">{m.correction.en}</p>
                  <p className="mt-1.5 text-sm font-medium text-ink/80">{m.correction.why}</p>
                  <button
                    type="button"
                    onClick={() => props.onPractice(m.correction!)}
                    className="press mt-2.5 rounded-xl bg-arishina px-3.5 py-1.5 text-sm font-bold text-[#1c1b3a] shadow-[0_2px_0_0_var(--arishina-deep)]"
                  >
                    Practice saying this
                  </button>
                </div>
              )}

              {/* Cultural / Grammar Tip */}
              {m.tip && (
                <div className="ml-4 flex items-start gap-2 rounded-xl border border-line bg-raised px-3.5 py-2 text-xs font-semibold text-ink-soft">
                  <span className="text-base" aria-hidden="true">💡</span>
                  <span><strong>Tip:</strong> {m.tip}</span>
                </div>
              )}

              {/* Scenario Completion Card */}
              {m.completed && (
                <div className="ml-4 mt-2 flex flex-col items-center gap-2 rounded-2xl border-2 border-good bg-good-wash p-5 text-center shadow-xs">
                  <Neela mood="cheer" size={68} />
                  <h3 className="text-xl font-extrabold text-good">🎉 Mission Completed!</h3>
                  <p className="text-sm font-semibold text-ink-soft max-w-sm">
                    Great job practicing Kannada with Neela! You earned <strong>+15 XP</strong> for finishing this scenario.
                  </p>
                  <button
                    type="button"
                    onClick={props.onRestartScenario}
                    className="press mt-2 rounded-xl bg-arishina px-5 py-2.5 font-bold text-[#1c1b3a] shadow-[0_3px_0_0_var(--arishina-deep)]"
                  >
                    Practice Again
                  </button>
                </div>
              )}

              {/* Suggested Reply Chips (Scaffolding for learners) */}
              {isLatest && !m.completed && m.suggestions && m.suggestions.length > 0 && (
                <div className="ml-2 mt-1 flex flex-col gap-2 rounded-2xl border border-arishina-deep/30 bg-arishina-wash/40 p-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Suggested replies (tap to send):
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {m.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => props.onSelectSuggestion(sug)}
                        className="press group flex flex-col items-start rounded-xl border-2 border-line bg-paper p-3 text-left transition hover:border-arishina-deep hover:bg-arishina-wash/50"
                      >
                        <span className="kn text-base font-bold text-ink group-hover:text-ink">{sug.kn}</span>
                        <span className="text-xs font-semibold text-kumkuma">{sug.tr}</span>
                        <span className="text-xs text-ink-soft">{sug.en}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}

        {props.busy && (
          <li className="flex items-center gap-3 text-ink-soft" aria-busy="true">
            <Neela mood="idle" size={48} /> Neela is thinking…
          </li>
        )}
        <div ref={bottom} />
      </ol>

      {props.error && (
        <p className="text-center font-semibold text-kumkuma" role="alert">
          {props.error}
        </p>
      )}

      {/* Input controls sticky footer */}
      <div className="sticky bottom-3 flex flex-col gap-2 rounded-2xl border-2 border-line bg-paper p-3 shadow-md">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-soft">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={props.autoVoice}
              onChange={(e) => props.setAutoVoice(e.target.checked)}
              className="accent-kumkuma"
            />
            <span>Auto-speak Neela&apos;s voice</span>
          </label>

          <div className="flex items-center gap-1.5">
            <span>Speech language:</span>
            <span className="flex gap-1" role="radiogroup" aria-label="Speaking language">
              {(
                [
                  ["kn-IN", "Kannada"],
                  ["en-IN", "English"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={props.lang === id}
                  onClick={() => props.setLang(id)}
                  className={`rounded-lg px-2 py-0.5 text-xs font-bold ${props.lang === id ? "bg-arishina-wash text-ink border border-arishina-deep" : "text-ink-soft"}`}
                >
                  {label}
                </button>
              ))}
            </span>
          </div>
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            props.onSend();
          }}
        >
          <button
            type="button"
            onClick={props.onTalk}
            disabled={props.listening || props.busy || !props.supported}
            aria-label={props.listening ? "Listening" : "Speak to Neela"}
            className={`press grid h-14 w-14 shrink-0 place-items-center rounded-full text-white disabled:cursor-not-allowed ${
              props.listening ? "bg-kumkuma-deep animate-pulse" : "bg-kumkuma"
            } ${!props.supported ? "opacity-50" : ""}`}
          >
            <MicIcon size={26} />
          </button>
          <input
            value={props.input}
            onChange={(e) => props.setInput(e.target.value)}
            placeholder="Type in Kannada or English, or tap a suggestion..."
            aria-label="Type a message"
            maxLength={300}
            className="min-w-0 flex-1 rounded-xl border-2 border-line bg-raised px-3 py-3 text-base focus:border-arishina-deep focus:outline-none"
          />
          <button
            type="submit"
            disabled={!props.input.trim() || props.busy}
            className="press rounded-xl bg-arishina px-4 py-3 font-bold text-[#1c1b3a] disabled:bg-line disabled:text-ink-soft"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}

function MicIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1A7 7 0 0 0 19 12h-2z"
      />
    </svg>
  );
}
