import { connection, NextResponse } from "next/server";
import { allowRequest, askNeela, NeelaError, pickProvider, sanitizeInput } from "@/lib/neelaAI";

/** Lets the app know whether Neela's chat is switched on, without revealing anything else. */
export async function GET() {
  // Read the environment when the request arrives, not once at build time
  await connection();
  return NextResponse.json({ configured: pickProvider(process.env) !== null });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const input = sanitizeInput(body);
  if (!input) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  try {
    const reply = await askNeela(input, process.env);
    return NextResponse.json(reply);
  } catch (e) {
    if (e instanceof NeelaError && e.code === "not_configured") {
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
