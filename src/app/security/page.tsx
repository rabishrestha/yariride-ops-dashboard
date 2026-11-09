"use client";
import { useLatest } from "@/lib/hooks";
import { SecurityCard } from "@/components/security-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
  const { data, error, isLoading } = useLatest();

  if (error) return <p className="text-red-500">Failed: {(error as Error).message}</p>;
  if (isLoading || !data) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SecurityCard security={data.security} />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent errors</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Coming soon — the last N entries from the app error log will appear here.
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Firewall & baseline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Ports in <span className="text-emerald-600 dark:text-emerald-400">green</span>{" "}
            match the expected baseline (22, 80, 443, 8080). Any other port shows in{" "}
            <span className="text-red-600 dark:text-red-400">red</span> — investigate
            before allowing it through the firewall.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}