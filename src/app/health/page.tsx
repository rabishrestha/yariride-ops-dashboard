// src/app/health/page.tsx

"use client";
import { useEffect, useState } from "react";
import { Activity, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthCheckRow } from "@/components/health-check-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { HealthPayload } from "@/lib/types";
import { RedisDetailCard } from "@/components/redis-detail-card";
import { formatUptime } from "@/lib/redis-parse";

function useHealth(env: "prod" | "test") {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/health?env=${env}`)
      .then((r) => r.json())
      .then((d: HealthPayload) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [env, tick]);

  const refresh = () => setTick((n) => n + 1);
  return { data, loading, refresh };
}

function StatusHeader({
  env,
  data,
  loading,
  onRefresh,
}: {
  env: "prod" | "test";
  data: HealthPayload | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const healthy = data?.status === "healthy";
  const unreachable = data?.status === "unreachable";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {healthy ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          {env === "prod" ? "Production" : "Test"}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={healthy ? "default" : "destructive"}>
            {data?.status ?? "—"}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Version</span>
          <span className="font-mono text-xs">{data?.version ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Uptime</span>
          <span className="font-mono text-xs">
            {formatUptime(data?.uptime)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">HTTP</span>
          <span className="font-mono text-xs">
            {unreachable
              ? data?.error ?? "unreachable"
              : data?.http_status ?? 200}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Round trip</span>
          <span className="font-mono text-xs">
            {data?.elapsed_ms ?? "—"} ms
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Checks runtime</span>
          <span className="font-mono text-xs">
            {data?.metadata?.check_duration ?? "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cache TTL</span>
          <span className="font-mono text-xs">
            {data?.metadata?.cache_ttl ?? "—"}
          </span>
        </div>
        {data?.summary && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Checks</span>
            <span className="font-mono text-xs">
              {data.summary.healthy}/{data.summary.total} healthy
              {data.summary.degraded > 0 &&
                ` · ${data.summary.degraded} degraded`}
              {data.summary.unhealthy > 0 &&
                ` · ${data.summary.unhealthy} unhealthy`}
              {data.summary.critical > 0 &&
                ` · ${data.summary.critical} critical`}
            </span>
          </div>
        )}
        {data?.checked_at && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fetched</span>
            <span className="font-mono text-xs">
              {new Date(data.checked_at).toLocaleTimeString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HealthPage() {
  const prod = useHealth("prod");
  const test = useHealth("test");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">API Health</h1>
        <p className="text-sm text-muted-foreground">
          Live probe of <code>api.yariride.com/health</code> and{" "}
          <code>api-test.yariride.com/health</code>. Requests are proxied
          server-side and timed out at 8 s.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatusHeader
          env="prod"
          data={prod.data}
          loading={prod.loading}
          onRefresh={prod.refresh}
        />
        <StatusHeader
          env="test"
          data={test.data}
          loading={test.loading}
          onRefresh={test.refresh}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(["prod", "test"] as const).map((env) => {
          const { data, loading } = env === "prod" ? prod : test;
          return (
            <Card key={env}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Checks — {env === "prod" ? "Production" : "Test"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading || !data ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : data.checks ? (
                  Object.entries(data.checks).map(([name, check]) => (
                    <HealthCheckRow key={name} name={name} check={check} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No checks available ({data.error ?? data.status}).
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RedisDetailCard data={prod.data} />
        <RedisDetailCard data={test.data} />
      </section>

      <p className="text-xs text-muted-foreground">
        <Activity className="mr-1 inline h-3 w-3" />
        Each environment refreshes on page load and on manual refresh. Both
        upstream APIs cache their own result for 10 s, so hammering this page is
        safe.
      </p>
    </div>
  );
}