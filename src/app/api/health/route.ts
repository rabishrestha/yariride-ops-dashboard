import { NextRequest, NextResponse } from "next/server";

const URLS: Record<string, string> = {
  prod: "https://api.yariride.com/health",
  test: "https://api-test.yariride.com/health",
};

export async function GET(req: NextRequest) {
  const env = req.nextUrl.searchParams.get("env") ?? "prod";
  const url = URLS[env];

  if (!url) {
    return NextResponse.json({ error: `Unknown env: ${env}` }, { status: 400 });
  }

  const start = Date.now();
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000), // don't hang 20s like raw curl does
    });

    const elapsed = Date.now() - start;

    if (!res.ok) {
      return NextResponse.json(
        {
          env,
          status: "unreachable",
          http_status: res.status,
          elapsed_ms: elapsed,
          error: `Upstream ${res.status}`,
        },
        { status: 200 },
      );
    }

    const body = await res.json();
    return NextResponse.json({
      env,
      elapsed_ms: elapsed,
      checked_at: new Date().toISOString(),
      ...body,
    });
  } catch (err) {
    const elapsed = Date.now() - start;
    return NextResponse.json({
      env,
      status: "unreachable",
      elapsed_ms: elapsed,
      error: err instanceof Error ? err.message : "fetch failed",
    });
  }
}