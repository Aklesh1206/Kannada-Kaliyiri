import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Server-side TTS endpoint for Kannada speech.
 * Proxies speech generation from Google Translate TTS with proper server headers,
 * avoiding CORS and referrer blocks that prevent browsers from loading it directly.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text")?.trim();

  if (!text) {
    return new NextResponse("Missing text parameter", { status: 400 });
  }

  // Cap text length to prevent misuse
  const clean = text.slice(0, 300);

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=kn&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
        Accept: "audio/mpeg, audio/*;q=0.9, */*;q=0.8",
      },
      cache: "force-cache",
    });

    if (!res.ok) {
      return new NextResponse(`Upstream TTS returned ${res.status}`, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    return new NextResponse("TTS service unavailable", { status: 502 });
  }
}
