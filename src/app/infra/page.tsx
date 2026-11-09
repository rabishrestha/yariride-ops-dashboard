"use client";
import { useLatest } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DockerTable } from "@/components/docker-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function InfraPage() {
  const { data, error, isLoading } = useLatest();

  if (error) return <p className="text-red-500">Failed: {(error as Error).message}</p>;
  if (isLoading || !data) return <Skeleton className="h-64" />;

  const { docker, infra, cloudflared, cloudflare_latency } = data;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cloudflare Tunnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{cloudflared?.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-mono">{cloudflared?.connections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protocol</span>
              <span className="font-mono">{cloudflared?.protocol}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Postgres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-mono">{infra?.postgres?.active_conns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ride DB</span>
              <span className="font-mono">{infra?.postgres?.size_ride}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">test DB</span>
              <span className="font-mono">{infra?.postgres?.size_test}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Redis & RabbitMQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Redis prod</span>
              <span className="font-mono">
                {infra?.redis_prod?.keys} keys · {infra?.redis_prod?.mem}
              </span>
            </div>
            {infra?.redis_test && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redis test</span>
                <span className="font-mono">
                  {infra.redis_test.keys} keys · {infra.redis_test.mem}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">RabbitMQ</span>
              <span className="font-mono">{infra?.rabbitmq}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cloudflare edge latency</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-8 text-sm">
          <div>
            <div className="text-muted-foreground">Prod TTFB</div>
            <div className="text-2xl font-semibold">
              {cloudflare_latency?.prod_ttfb_ms ?? "?"} ms
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Test TTFB</div>
            <div className="text-2xl font-semibold">
              {cloudflare_latency?.test_ttfb_ms ?? "?"} ms
            </div>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-2 text-lg font-medium">Docker containers</h2>
        <DockerTable docker={docker} />
      </section>
    </div>
  );
}