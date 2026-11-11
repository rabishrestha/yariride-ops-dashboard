import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const base = process.env.METRICS_API_URL;
  const key = process.env.METRICS_API_KEY;

  if (!base || !key) {
    return NextResponse.json(
      { error: "METRICS_API_URL or METRICS_API_KEY not configured" },
      { status: 500 },
    );
  }

  const hours = req.nextUrl.searchParams.get("hours");
  const url = hours ? `${base}/api/vitals?hours=${hours}` : `${base}/api/vitals`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}`, body: await res.text() },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 502 },
    );
  }
}