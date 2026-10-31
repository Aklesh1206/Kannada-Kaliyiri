"use client";

/**
 * Plays a Kannada phrase, trying sources in order:
 *  1. /audio/<phraseId>.mp3 (pre-generated static mp3, best for lessons, works 100% offline)
 *  2. Browser's native Kannada voice (Web Speech API - instant in Edge or Windows with Kannada pack)
 *  3. /api/tts?text=<text> (Next.js server-side TTS proxy - works in Chrome, Firefox, Safari on any device)
 *  4. Direct online Google TTS endpoint
 * If all fail, a toast guides the learner on how to use Edge or install the Windows Kannada speech pack.
 */

/** Same name scripts/generate_audio.py gives to the mp3 of a line of text (FNV-1a hash of the Kannada text). */
export function textAudioName(text: string): string {
  let h = 0x811c9dc5;
  const t = text.trim();
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `t-${h.toString(16).padStart(8, "0")}`;
}

let current: HTMLAudioElement | null = null;
let token = 0;
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

function toast(text: string) {
  if (typeof document === "undefined") return;
  document.getElementById("kk-audio-toast")?.remove();
  const el = document.createElement("div");
  el.id = "kk-audio-toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  el.style.cssText =
    "position:fixed;left:50%;top:72px;transform:translateX(-50%);max-width:90vw;z-index:9999;" +
    "background:#1c1b3a;color:#fff;padding:12px 18px;border-radius:14px;font:600 15px system-ui;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.4);";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5500);
}

function kannadaVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const list = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices();
  return (
    list.find((v) => v.lang.toLowerCase().replace("_", "-") === "kn-in") ??
    list.find((v) => v.lang.toLowerCase().startsWith("kn")) ??
    list.find((v) => v.name.toLowerCase().includes("kannada"))
  );
}

function speakBrowser(text: string, slow: boolean): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const voice = kannadaVoice();
  if (!voice) return false; // reading Kannada with an English voice produces nonsense, so skip

  try {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang || "kn-IN";
    u.rate = slow ? 0.65 : 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
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
      if (id !== token) audio.pause(); // a newer tap replaced this one while loading
      done(true);
    };
    audio.play().catch(() => done(false));
    // A request that hangs (offline, blocked) should not stop the next source from trying
    setTimeout(() => done(false), 3500);
  });
}

export function playPhrase(phraseId: string, kn: string, slow = false) {
  if (typeof window === "undefined") return;
  const id = ++token;
  current?.pause();
  window.speechSynthesis?.cancel();

  (async () => {
    // 1. Try static offline mp3 if it's an established phrase ID (not a dynamic AI or offline dialogue tag)
    const isDynamic = phraseId.startsWith("neela-") || phraseId.startsWith("ai-") || phraseId.startsWith("offline-");
    if (!isDynamic) {
      if (await tryAudio(`/audio/${phraseId}.mp3`, slow, id)) return;
      if (id !== token) return;
    } else {
      // Neela's built-in conversation lines have mp3s named after their text (scripts/generate_audio.py makes them)
      if (await tryAudio(`/audio/${textAudioName(kn)}.mp3`, slow, id)) return;
      if (id !== token) return;
    }

    // 2. Try browser's native Kannada voice (instant & offline in Edge or Windows with Kannada pack)
    if (speakBrowser(kn, slow)) return;
    if (id !== token) return;

    // 3. Try Next.js server-side TTS proxy (/api/tts)
    const proxyUrl = `/api/tts?text=${encodeURIComponent(kn)}`;
    if (await tryAudio(proxyUrl, slow, id)) return;
    if (id !== token) return;

    // 4. Fallback direct online URL
    const online = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=kn&q=${encodeURIComponent(kn)}`;
    if (await tryAudio(online, slow, id)) return;
    if (id !== token) return;

    // 5. If everything failed, inform the user with helpful options
    toast("Audio is not available offline here yet. Open in Microsoft Edge (which has a free Kannada voice built-in) or check your internet connection.");
  })();
}
