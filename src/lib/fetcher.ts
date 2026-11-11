export async function fetcher<T>(url: string): Promise<T> {
  const key = process.env.NEXT_PUBLIC_METRICS_KEY;

  if (!key) {
    throw new Error("NEXT_PUBLIC_METRICS_KEY is missing in .env.local");
  }

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}