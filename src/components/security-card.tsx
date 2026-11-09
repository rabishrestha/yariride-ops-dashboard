import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SecurityMetrics } from "@/lib/types";

const SAFE_PORTS = new Set(["22", "80", "443", "8080"]);

export function SecurityCard({ security }: { security: SecurityMetrics }) {
  const warn = security.ssh_failed_24h > 20;
  const ports = security.listening_ports
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Security — last 24h</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">SSH failed logins</span>
          <span className={warn ? "font-semibold text-red-500" : "font-semibold"}>
            {security.ssh_failed_24h}
          </span>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground">Listening ports</span>
          <div className="flex flex-wrap gap-1">
            {ports.map((p) => {
              const unexpected = !SAFE_PORTS.has(p);
              return (
                <span
                  key={p}
                  className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                    unexpected
                      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-muted"
                  }`}
                >
                  {p}
                </span>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
