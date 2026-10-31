import { connection } from "next/server";

/**
 * Server-side TTS endpoint for Kannada speech.
 * Fetches the voice from the server so browsers do not hit CORS or referrer blocks,
 * and returns the mp3. Only short Kannada text is accepted.
 * (No `export const dynamic`: it is not allowed together with cacheComponents. `connection()` does the job.)
 */
const KANNADA = /[ಀ-೿]/;

export async function GET(req: Request) {
  await connection();
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text") ?? searchParams.get("q") ?? "").trim();

  if (!text || text.length > 300 || !KANNADA.test(text)) {
    return new Response("Provide Kannada text in the text parameter (max 300 characters).", { status: 400 });
  }

  try {
    const res = await fetch(
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=kn&q=${encodeURIComponent(text)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/",
          Accept: "audio/mpeg, audio/*;q=0.9, */*;q=0.8",
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return new Response("Voice service unavailable.", { status: 502 });
    return new Response(await res.arrayBuffer(), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400" },
    });
  } catch {
    return new Response("Voice service unavailable.", { status: 502 });
  }
}
