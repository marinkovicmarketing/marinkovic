import { NextResponse } from "next/server";
import { generateDailySlate } from "@/lib/runGeneration";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // AI + fixture calls can take a while

/**
 * Triggers today's tip generation over HTTP so it can be driven by a scheduler that
 * can't run npm scripts directly (Vercel Cron, cron-job.org, a VPS crontab curl call).
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically when that env
 * var is set; other callers can pass `?secret=...` instead. If CRON_SECRET is unset,
 * the endpoint is unauthenticated — fine for local dev, not for production.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const authHeader = request.headers.get("authorization");
    const querySecret = new URL(request.url).searchParams.get("secret");
    const authorized = authHeader === `Bearer ${secret}` || querySecret === secret;
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const summary = await generateDailySlate();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("Cron generate-tips fehlgeschlagen:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
