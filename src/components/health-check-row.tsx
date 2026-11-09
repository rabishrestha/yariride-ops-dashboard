import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HealthCheck } from "@/lib/types";

function renderMetadata(name: string, meta: Record<string, unknown> | undefined) {
  if (!meta) return null;

  if (name === "database_read" || name === "database_write") {
    const inUse = meta.in_use as number | undefined;
    const open = meta.open_connections as number | undefined;
    const idle = meta.idle as number | undefined;
    const max = meta.max_open_connections as number | undefined;
    const util = meta.utilization as number | undefined;
    return (
      <span>
        {inUse ?? "?"} in use · {open ?? "?"} open · {idle ?? "?"} idle ·{" "}
        {max ?? "?"} max
        {util !== undefined && ` (${(util * 100).toFixed(1)}%)`}
      </span>
    );
  }

  if (name === "websocket_hub") {
    const conns = meta.active_connections as number | undefined;
    return (
      <span>
        {conns ?? "?"} active WS connections
        {conns === 0 && (
          <span className="ml-1 text-muted-foreground/60">(idle)</span>
        )}
      </span>
    );
  }

  if (name === "redis_cache") {
    const info = meta.redis_info as string | undefined;
    if (!info) return null;
    const usedHuman = info.match(/used_memory_human:(\S+)/)?.[1];
    const frag = info.match(/mem_fragmentation_ratio:(\S+)/)?.[1];
    const clients = info.match(/mem_clients_normal:(\d+)/)?.[1];
    return (
      <span>
        {usedHuman ?? "?"} · frag {frag ?? "?"} · {clients ?? "?"} clients
      </span>
    );
  }

  return null;
}

export function HealthCheckRow({
  name,
  check,
}: {
  name: string;
  check: HealthCheck | undefined;
}) {
  if (!check) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <span className="font-mono text-xs">{name}</span>
        <Badge variant="outline" className="text-xs">
          missing
        </Badge>
      </div>
    );
  }

  const healthy = check.status === "healthy";
  const durationMs = check.duration / 1_000_000;
  const checkedAt = check.timestamp
    ? new Date(check.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="flex items-start justify-between gap-4 rounded-md border px-3 py-2 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{name}</span>
          <Badge
            variant={healthy ? "default" : "destructive"}
            className="text-xs"
          >
            {check.status}
          </Badge>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {renderMetadata(name, check.metadata)}
        </div>
        {checkedAt && (
          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
            at {checkedAt}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
        {durationMs < 1
          ? `${durationMs.toFixed(2)}ms`
          : `${durationMs.toFixed(0)}ms`}
      </div>
    </div>
  );
}