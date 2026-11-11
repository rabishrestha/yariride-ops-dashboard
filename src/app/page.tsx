"use client";
import React, { useEffect } from "react";
import {
  Activity,
  Database,
  Cloud,
  RadioTower,
} from "lucide-react";
import { useLatest, useSampledHistory } from "@/lib/hooks";
import { StatusTile } from "@/components/status-tile";
import { HostCard } from "@/components/host-card";
import { SecurityCard } from "@/components/security-card";
import { DockerTable } from "@/components/docker-table";
import { LineChartCard } from "@/components/line-chart-card";
import { WarningBanner } from "@/components/warning-banner";
import { SuggestionCard } from "@/components/suggestion-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  parseUsedTotal,
  parseDiskPct,
  statusFromString,
} from "@/lib/parse";

export default function OverviewPage() {
  const { data: latest, error, isLoading } = useLatest();
  const { data: history } = useSampledHistory(24, 1);

  // Convert all timestamps to Unix milliseconds for Recharts
  const memPoints =
    history?.map((s) => ({
      t: new Date(s.timestamp).getTime(),
      host: +parseUsedTotal(s.host.mem).used.toFixed(0),
      prod: s.api?.prod?.mem_mb ?? 0,
      test: s.api?.test?.mem_mb ?? 0,
    })) ?? [];

  const latencyPoints =
    history?.map((s) => ({
      t: new Date(s.timestamp).getTime(),
      edge: s.cloudflare_latency?.prod_ttfb_ms ?? 0,
      origin: s.api?.prod?.http_time_ms ?? 0,
    })) ?? [];

  const diskPoints =
    history?.map((s) => ({
      t: new Date(s.timestamp).getTime(),
      root: +parseDiskPct(s.host.disk_root).pct.toFixed(1),
      opt: +parseDiskPct(s.host.disk_opt).pct.toFixed(1),
    })) ?? [];

  // --- DEBUG BLOCK ---
  useEffect(() => {
    if (history && history.length > 0) {
      console.log("=== CHART DATA DEBUG ===");
      console.log("Total points in history:", history.length);
      console.log("First point:", new Date(history[0].timestamp).toLocaleTimeString());
      console.log("Last point:", new Date(history[history.length - 1].timestamp).toLocaleTimeString());
      console.log("Mapped memPoints last item:", memPoints[memPoints.length - 1]);
    }
  }, [history, memPoints]);
  // -------------------

  if (error && !latest) {
    return (
      <p className="text-red-500">
        Failed to load initial metrics: {(error as Error).message}
      </p>
    );
  }

  if (isLoading || !latest) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const highLatency = (latest.cloudflare_latency?.prod_ttfb_ms ?? 0) > 2000;
  const diskPct = parseDiskPct(latest.host.disk_root).pct;
  const anyRestarts =
    (latest.api?.prod?.restarts ?? 0) > 0 || (latest.api?.test?.restarts ?? 0) > 0;

  return (
    <div className="space-y-6">
      {highLatency && (
        <WarningBanner
          message={`High Cloudflare Edge Latency detected (${
            latest.cloudflare_latency.prod_ttfb_ms
          } ms). Consider Argo Smart Routing.`}
        />
      )}

      {/* Status tiles */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusTile
          title="Prod API"
          status={statusFromString(latest.api?.prod?.status)}
          primary={latest.api?.prod?.status ?? "—"}
          secondary={`${latest.api?.prod?.http_time_ms ?? "?"} ms · ${latest.api?.prod?.http_status ?? "—"}`}
          icon={Activity}
        />
        <StatusTile
          title="Test API"
          status={statusFromString(latest.api?.test?.status)}
          primary={latest.api?.test?.status ?? "—"}
          secondary={`${latest.api?.test?.http_time_ms ?? "?"} ms · ${latest.api?.test?.http_status ?? "—"}`}
          icon={RadioTower}
        />
        <StatusTile
          title="Postgres"
          status={latest.infra?.postgres?.active_conns >= 0 ? "ok" : "unknown"}
          primary={`${latest.infra?.postgres?.active_conns ?? "?"} conns`}
          secondary={`ride ${latest.infra?.postgres?.size_ride ?? "?"} · test ${latest.infra?.postgres?.size_test ?? "?"}`}
          icon={Database}
        />
        <StatusTile
          title="Cloudflare Tunnel"
          status={statusFromString(latest.cloudflared?.status)}
          primary={latest.cloudflared?.status ?? "—"}
          secondary={`${latest.cloudflared?.connections ?? "?"} conns · ${latest.cloudflared?.protocol ?? "—"}`}
          icon={Cloud}
        />
      </section>

      {/* Suggestions */}
      {(diskPct > 80 || anyRestarts) && (
        <section className="grid gap-4 md:grid-cols-2">
          {diskPct > 80 && (
            <SuggestionCard title="Disk usage above 80%">
              Consider pruning Docker images and rotating logs. See the{" "}
              <a href="/housekeeping" className="underline">
                Housekeeping
              </a>{" "}
              page for the exact commands.
            </SuggestionCard>
          )}
          {anyRestarts && (
            <SuggestionCard title="API restarts detected">
              One of the API containers has restarted recently. Inspect Docker logs
              from the Infrastructure page.
            </SuggestionCard>
          )}
        </section>
      )}

      {/* Host + Security */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HostCard host={latest.host} />
        <SecurityCard security={latest.security} />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {history ? (
          <>
            <LineChartCard
              title="Memory usage (MB) — 24h"
              data={memPoints}
              series={[
                { key: "host", label: "Host", color: "#6366f1" },
                { key: "prod", label: "Prod API", color: "#ef4444" },
                { key: "test", label: "Test API", color: "#3b82f6" },
              ]}
              unit=" MB"
            />
            <LineChartCard
              title="Edge latency vs Origin response (ms) — 24h"
              data={latencyPoints}
              series={[
                { key: "edge", label: "Cloudflare TTFB", color: "#f59e0b" },
                { key: "origin", label: "Origin", color: "#10b981" },
              ]}
              unit=" ms"
            />
            <div className="lg:col-span-2">
              <LineChartCard
                title="Disk usage (%) — 24h"
                data={diskPoints}
                series={[
                  { key: "root", label: "/", color: "#8b5cf6" },
                  { key: "opt", label: "/opt", color: "#06b6d4" },
                ]}
                unit="%"
                yDomain={[0, 100]}
              />
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <div className="lg:col-span-2">
              <Skeleton className="h-72" />
            </div>
          </>
        )}
      </section>

      {/* Docker quick view */}
      <section>
        <h2 className="mb-2 text-lg font-medium">Docker containers</h2>
        <DockerTable docker={latest.docker} />
      </section>
    </div>
  );
}