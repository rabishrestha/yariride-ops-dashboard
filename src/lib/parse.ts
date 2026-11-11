export function parseUsedTotal(value: string) {
  if (!value) return { used: 0, total: 0, pct: 0 };
  // Matches "1072 / 7937 MB" or "1072/7937"
  const m = value.match(/([\d.]+)\s*\/\s*([\d.]+)/);
  if (!m) return { used: 0, total: 0, pct: 0 };
  const used = parseFloat(m[1]);
  const total = parseFloat(m[2]);
  return { used, total, pct: total ? (used / total) * 100 : 0 };
}

export function parseDiskPct(value: string) {
  if (!value) return { used: 0, total: 0, pct: 0 };
  // Matches "22G / 48G (48%)" or "22 / 48"
  const m = value.match(/([\d.]+)G?\s*\/\s*([\d.]+)G?/);
  const used = m ? parseFloat(m[1]) : 0;
  const total = m ? parseFloat(m[2]) : 0;
  return { used, total, pct: total ? (used / total) * 100 : 0 };
}

export function parseLoad1(value: string) {
  if (!value) return 0;
  return parseFloat(value.split(",")[0].trim()) || 0;
}

export function statusFromString(s: string | undefined): "ok" | "warn" | "error" | "unknown" {
  if (!s) return "unknown";
  const v = s.toLowerCase();
  if (v === "active" || v.includes("up") || v.includes("healthy") || v === "200 ok")
    return "ok";
  if (v.includes("warn") || v.includes("restart") || v.includes("degraded"))
    return "warn";
  return "error";
}