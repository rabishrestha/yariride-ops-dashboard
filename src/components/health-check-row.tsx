import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HealthCheck } from "@/lib/types";

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
        <Badge variant="outline" className="text-xs">missing</Badge>
      </div>
    );
  }

  const healthy = check.status === "healthy";
  const durationMs = check.duration / 1_000_000;

  return (
    <div className="flex items-start justify-between gap-4 rounded-md border px-3 py-2 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{name}</span>
          <Badge variant={healthy ? "default" : "destructive"} className="text-xs">
            {check.status}
          </Badge>
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {check.message}
        </div>
      </div>
      <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
        {durationMs < 1 ? `${durationMs.toFixed(2)}ms` : `${durationMs.toFixed(0)}ms`}
      </div>
    </div>
  );
}