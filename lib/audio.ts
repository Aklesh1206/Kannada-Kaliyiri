"use client";

let current: HTMLAudioElement | null = null;

function speakFallback(text: string, slow = false) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "kn-IN";
  u.rate = slow ? 0.65 : 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/**
 * Plays /audio/<phraseId>.mp3 (made by scripts/generate_audio.py).
 * If the file is missing, the browser's own Kannada voice reads the script, which only works on some devices.
 */
export function playPhrase(phraseId: string, kn: string, slow = false) {
  if (typeof window === "undefined") return;
  current?.pause();
  window.speechSynthesis?.cancel();
  const audio = new Audio(`/audio/${phraseId}.mp3`);
  audio.playbackRate = slow ? 0.75 : 1;
  current = audio;
  let fellBack = false;
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    speakFallback(kn, slow);
  };
  audio.onerror = fallback;
  audio.play().catch(fallback);
}
