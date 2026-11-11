"use client";
import useSWR from "swr";
import { fetcher } from "./fetcher";
import type { Snapshot } from "./types";

const DIRECT_API = "http://100.66.193.15:9090/api/vitals";

export function useLatest() {
  return useSWR<Snapshot>(DIRECT_API, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
    errorRetryCount: 3,
  });
}

export function useHistory(hours = 24) {
  return useSWR<Snapshot[]>(`${DIRECT_API}?hours=${hours}`, fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
    errorRetryCount: 3,
  });
}

export function useSampledHistory(hours = 24, every = 1) {
  const { data, error, isLoading } = useHistory(hours);
  const sampled = every === 1 ? data : data?.filter((_, i) => i % every === 0);
  return { data: sampled, error, isLoading };
}