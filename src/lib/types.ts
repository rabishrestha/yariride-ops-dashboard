export interface HostMetrics {
  uptime: string;
  load: string;
  mem: string;
  swap: string;
  disk_root: string;
  disk_opt: string;
}

export interface ApiService {
  status: string;
  mem_mb?: number;
  restarts?: number;
  http_status?: string;
  http_time_ms: number;
}

export interface InfraMetrics {
  postgres: {
    active_conns: number;
    size_ride: string;
    size_test: string;
    [k: string]: unknown;
  };
  redis_prod: { mem: string; keys: number };
  redis_test?: { mem: string; keys: number };
  rabbitmq: string;
}

export interface SecurityMetrics {
  ssh_failed_24h: number;
  listening_ports: string;
}

export interface CloudflaredMetrics {
  status: string;
  connections: number;
  protocol: string;
}

export interface CloudflareLatency {
  prod_ttfb_ms: number;
  test_ttfb_ms: number;
}

export interface Snapshot {
  timestamp: string;
  host: HostMetrics;
  api: { prod: ApiService; test: ApiService };
  infra: InfraMetrics;
  security: SecurityMetrics;
  cloudflared: CloudflaredMetrics;
  cloudflare_latency: CloudflareLatency;
  docker: Record<string, string>;
}

export type Status = "ok" | "warn" | "error" | "unknown";

export interface HealthCheck {
  status: string;
  message: string;
  duration: number; // nanoseconds
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface HealthPayload {
  env: "prod" | "test";
  status: "healthy" | "degraded" | "unhealthy" | "critical" | "unreachable";
  http_status?: number;
  version?: string;
  uptime?: number;
  timestamp?: string;
  checks?: Record<string, HealthCheck>;
  summary?: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    critical: number;
  };
  metadata?: { cache_ttl?: string; check_duration?: string };
  elapsed_ms: number;
  checked_at: string;
  error?: string;
}