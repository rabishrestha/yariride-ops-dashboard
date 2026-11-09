import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HealthPayload } from "@/lib/types";
import { parseRedisInfo, fragStatus } from "@/lib/redis-parse";

export function RedisDetailCard({ data }: { data: HealthPayload | null }) {
  const redis = data?.checks?.redis_cache;
  const info = parseRedisInfo(redis?.metadata?.redis_info as string | undefined);

  const frag = info.mem_fragmentation_ratio ?? 0;
  const status = fragStatus(frag);

  const oomRisk =
    info.maxmemory === 0 && info.maxmemory_policy === "noeviction";

  const allocFrag = info.allocator_frag_ratio ?? 0;
  const defragRunning = (info.active_defrag_running ?? 0) > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Redis detail</CardTitle>
        <Badge
          variant={
            status === "ok"
              ? "default"
              : status === "warn"
                ? "secondary"
                : "destructive"
          }
        >
          {redis?.status ?? "unknown"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Used memory" value={info.used_memory_human ?? "—"} />
        <Row
          label="Peak"
          value={`${info.used_memory_peak_perc ?? "—"} of ${info.used_memory_human ?? "—"}`}
        />
        <Row
          label="RSS memory"
          value={
            info.used_memory_rss
              ? `${(info.used_memory_rss / 1024 / 1024).toFixed(1)} MB`
              : "—"
          }
        />
        <Row
          label="Fragmentation"
          value={`${frag.toFixed(2)}×`}
          valueClass={
            status === "error"
              ? "text-red-600 font-semibold"
              : status === "warn"
                ? "text-amber-600"
                : undefined
          }
        />
        <Row
          label="Allocator frag"
          value={`${allocFrag.toFixed(2)}×`}
          valueClass={
            allocFrag > 1.5 ? "text-amber-600" : undefined
          }
        />
        <Row
          label="Active defrag"
          value={defragRunning ? "running" : "idle"}
          valueClass={defragRunning ? "text-amber-600" : undefined}
        />
        <Row
          label="Clients"
          value={`${info.mem_clients_normal ?? "?"} (normal)`}
        />
        <Row
          label="Maxmemory"
          value={info.maxmemory_human ?? "0 (unlimited)"}
        />
        <Row label="Eviction" value={info.maxmemory_policy ?? "—"} />
        {oomRisk && (
          <div className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            ⚠ No maxmemory and <code>noeviction</code> — Redis will OOM-kill
            under pressure. Consider setting <code>maxmemory</code> and{" "}
            <code>allkeys-lru</code>.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono text-xs ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}