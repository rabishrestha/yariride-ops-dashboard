"use client";
import { useLatest } from "@/lib/hooks";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from "date-fns-tz";

export function Topbar() {
  const { data } = useLatest();
  const healthy = data?.api?.prod?.status === "active";
  
  let updatedStr = "";
  if (data?.timestamp) {
    try {
      updatedStr = formatInTimeZone(
        new Date(data.timestamp),
        "Asia/Kathmandu",
        "HH:mm:ss"
      ) + " NPT";
    } catch (e) {
      updatedStr = "—";
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        <Badge variant={healthy ? "default" : "destructive"}>
          {healthy ? "All Systems Operational" : "Degraded"}
        </Badge>
        {updatedStr && (
          <span className="text-xs text-muted-foreground">
            Updated {updatedStr}
          </span>
        )}
      </div>
      <ThemeToggle />
    </header>
  );
}