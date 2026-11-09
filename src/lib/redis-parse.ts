import type { HealthRedisInfo } from "./types";

export function parseRedisInfo(raw: string | undefined): Partial<HealthRedisInfo> {
  if (!raw) return {};
  const get = (key: string) => raw.match(new RegExp(`^${key}:(.*)$`, "m"))?.[1]?.trim();

  return {
    used_memory: Number(get("used_memory") ?? 0),
    used_memory_human: get("used_memory_human") ?? "—",
    used_memory_peak: Number(get("used_memory_peak") ?? 0),
    used_memory_peak_perc: get("used_memory_peak_perc") ?? "—",
    used_memory_rss: Number(get("used_memory_rss") ?? 0),
    mem_fragmentation_ratio: Number(get("mem_fragmentation_ratio") ?? 0),
    mem_clients_normal: Number(get("mem_clients_normal") ?? 0),
    mem_clients_slaves: Number(get("mem_clients_slaves") ?? 0),
    maxmemory: Number(get("maxmemory") ?? 0),
    maxmemory_human: get("maxmemory_human") ?? "—",
    maxmemory_policy: get("maxmemory_policy") ?? "—",
    allocator_frag_ratio: Number(get("allocator_frag_ratio") ?? 0),
    active_defrag_running: Number(get("active_defrag_running") ?? 0),
  };
}

export function formatUptime(ns: number | undefined): string {
  if (!ns) return "—";
  const sec = ns / 1e9;
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export function fragStatus(ratio: number): "ok" | "warn" | "error" {
  if (ratio < 1.5) return "ok";
  if (ratio < 10) return "warn";
  return "error";
}