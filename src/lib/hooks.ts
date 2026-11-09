"use client";
import useSWR from "swr";
import { fetcher } from "./fetcher";
import type { Snapshot } from "./types";

export function useLatest() {
  return useSWR<Snapshot>("/api/vitals", fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  });
}

export function useHistory(hours = 24) {
  return useSWR<Snapshot[]>(`/api/vitals?hours=${hours}`, fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });
}

export function useSampledHistory(hours = 24, every = 5) {
  const { data, error, isLoading } = useHistory(hours);
  const sampled = data?.filter((_, i) => i % every === 0);
  return { data: sampled, error, isLoading };
}