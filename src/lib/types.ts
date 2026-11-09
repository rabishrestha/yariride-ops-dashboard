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