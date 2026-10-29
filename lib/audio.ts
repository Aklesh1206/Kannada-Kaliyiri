"use client";

/**
 * Plays a Kannada phrase, trying three sources in order:
 *  1. /audio/<phraseId>.mp3, made by scripts/generate_audio.py (best, works offline)
 *  2. an online Kannada voice, so the buttons work before any mp3 exists
 *  3. the browser's own Kannada voice, which only some devices have
 * If all three fail, a short message tells the learner why, instead of staying silent.
 */

let current: HTMLAudioElement | null = null;
let token = 0;

function toast(text: string) {
  if (typeof document === "undefined") return;
  document.getElementById("kk-audio-toast")?.remove();
  const el = document.createElement("div");
  el.id = "kk-audio-toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  el.style.cssText =
    "position:fixed;left:50%;top:72px;transform:translateX(-50%);max-width:90vw;z-index:9999;" +
    "background:#1c1b3a;color:#fff;padding:12px 18px;border-radius:14px;font:600 15px system-ui;text-align:center";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function kannadaVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().replace("_", "-") === "kn-in") ?? voices.find((v) => v.lang.toLowerCase().startsWith("kn"));
}

function speakBrowser(text: string, slow: boolean): boolean {
  if (!("speechSynthesis" in window)) return false;
  const voice = kannadaVoice();
  if (!voice) return false; // reading Kannada with an English voice produces nonsense, so say nothing
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = slow ? 0.65 : 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

function tryAudio(src: string, slow: boolean, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    audio.playbackRate = slow ? 0.75 : 1;
    audio.preload = "auto";
    current = audio;
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    audio.onerror = () => done(false);
    audio.onplaying = () => {
      if (id !== token) audio.pause(); // a newer tap replaced this one while it was loading
      done(true);
    };
    audio.play().catch(() => done(false));
    // A request that hangs (offline, blocked) should not stop the next source from trying
    setTimeout(() => done(false), 4000);
  });
}

export function playPhrase(phraseId: string, kn: string, slow = false) {
  if (typeof window === "undefined") return;
  const id = ++token;
  current?.pause();
  window.speechSynthesis?.cancel();

  (async () => {
    if (await tryAudio(`/audio/${phraseId}.mp3`, slow, id)) return;
    if (id !== token) return;
    const online = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=kn&q=${encodeURIComponent(kn)}`;
    if (await tryAudio(online, slow, id)) return;
    if (id !== token) return;
    if (speakBrowser(kn, slow)) return;
    toast("Audio is not available here yet. Try Microsoft Edge, which has a Kannada voice, or check your internet connection.");
  })();
}
