"use client";

// Thin wrapper over the browser's speech recognition (Chrome and Edge have it, Firefox does not).
// Kannada recognition goes through the browser vendor's servers, so it needs internet.

type Alternative = { transcript: string };
type ResultItem = ArrayLike<Alternative>;
type RecognitionEvent = { results: ArrayLike<ResultItem> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionConstructor = new () => Recognition;

export type SpeechErrorCode = "unsupported" | "not-allowed" | "no-mic" | "no-speech" | "network" | "language" | "other";

export class SpeechError extends Error {
  code: SpeechErrorCode;
  constructor(code: SpeechErrorCode) {
    super(code);
    this.code = code;
  }
}

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return recognitionConstructor() !== null;
}

function codeFor(error: string): SpeechErrorCode {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed";
    case "audio-capture":
      return "no-mic";
    case "no-speech":
      return "no-speech";
    case "network":
      return "network";
    case "language-not-supported":
      return "language";
    default:
      return "other";
  }
}

/** Listens once. `result` resolves with the recogniser's guesses, best first, or rejects with a SpeechError. */
export function listenOnce(lang = "kn-IN"): { result: Promise<string[]>; stop: () => void } {
  const Ctor = recognitionConstructor();
  if (!Ctor) return { result: Promise.reject(new SpeechError("unsupported")), stop: () => {} };

  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 5;

  const result = new Promise<string[]>((resolve, reject) => {
    let settled = false;
    rec.onresult = (e) => {
      settled = true;
      const first = e.results[0];
      resolve(first ? Array.from(first, (a) => a.transcript.trim()).filter(Boolean) : []);
    };
    rec.onerror = (e) => {
      if (settled) return;
      settled = true;
      reject(new SpeechError(codeFor(e.error)));
    };
    rec.onend = () => {
      if (settled) return;
      settled = true;
      reject(new SpeechError("no-speech"));
    };
    try {
      rec.start();
    } catch {
      settled = true;
      reject(new SpeechError("other"));
    }
  });
  return { result, stop: () => rec.stop() };
}

export function speechErrorMessage(code: SpeechErrorCode): string {
  switch (code) {
    case "not-allowed":
      return "The microphone is blocked. Allow it in your browser's site settings, then try again.";
    case "no-mic":
      return "No microphone found. Plug one in or skip this one.";
    case "no-speech":
      return "Did not hear anything. Tap the microphone and say it again.";
    case "network":
      return "Speech recognition needs an internet connection.";
    case "language":
      return "This browser cannot recognise Kannada speech.";
    case "unsupported":
      return "This browser does not support speech recognition. Chrome or Edge will work.";
    default:
      return "Speech recognition is not working right now. You can skip this one.";
  }
}
