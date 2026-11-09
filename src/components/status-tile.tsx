import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/types";
import { LucideIcon } from "lucide-react";

const dotColor: Record<Status, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
  unknown: "bg-slate-400",
};

const ringColor: Record<Status, string> = {
  ok: "ring-emerald-500/20",
  warn: "ring-amber-500/20",
  error: "ring-red-500/20",
  unknown: "ring-slate-500/20",
};

export function StatusTile({
  title,
  status,
  primary,
  secondary,
  icon: Icon,
}: {
  title: string;
  status: Status;
  primary: string;
  secondary?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-lg ring-2 ring-transparent",
        ringColor[status],
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className={cn("h-2.5 w-2.5 rounded-full", dotColor[status])} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{primary}</div>
        {secondary && (
          <p className="mt-1 text-xs text-muted-foreground">{secondary}</p>
        )}
      </CardContent>
    </Card>
  );
}