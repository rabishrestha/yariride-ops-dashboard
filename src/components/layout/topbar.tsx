"use client";
import { useLatest } from "@/lib/hooks";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export function Topbar() {
  const { data } = useLatest();
  const healthy = data?.api?.prod?.status === "active";
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        <Badge variant={healthy ? "default" : "destructive"}>
          {healthy ? "All Systems Operational" : "Degraded"}
        </Badge>
        {data && (
          <span className="text-xs text-muted-foreground">
            Updated {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
      <ThemeToggle />
    </header>
  );
}