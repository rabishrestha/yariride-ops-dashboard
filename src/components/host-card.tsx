import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HostMetrics } from "@/lib/types";

export function HostCard({ host }: { host: HostMetrics }) {
  const rows: [string, string][] = [
    ["Uptime", host.uptime],
    ["Load (1/5/15)", host.load],
    ["Memory", host.mem],
    ["Swap", host.swap],
    ["Disk /", host.disk_root],
    ["Disk /opt", host.disk_opt],
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Host</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-right font-mono text-xs">{v}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
