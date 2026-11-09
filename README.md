# Yariride Ops Dashboard

A multi-page server vitals and operations dashboard for **Yarri Ride**, built with Next.js (App Router), Tailwind CSS v4, shadcn/ui, and Recharts.

Visualizes live metrics from the Yari Ride Metrics API — host, APIs, Postgres, Redis, RabbitMQ, Cloudflare Tunnel, Docker containers, security events — plus a dedicated API health page that probes `api.yariride.com/health` and `api-test.yariride.com/health` side by side.

---

## Features

- **Overview** — status tiles (Prod, Test, Postgres, Cloudflare Tunnel), 24 h line charts for memory / edge latency / disk usage, host details, security summary, Docker quick view.
- **API Health** — live comparison of prod vs test `/health` endpoints with per-check status, durations, database pool pressure, and Redis deep-dive (memory, fragmentation, eviction policy).
- **Infrastructure** — Docker container states, Postgres connections and sizes, Redis keys/memory, RabbitMQ status, Cloudflare Tunnel connection info and edge TTFB.
- **Housekeeping** — UI stubs with confirmation modals for `logrotate`, `docker system prune`, and API restarts, plus a manual runbook.
- **Security** — SSH failed logins (24 h), listening ports with baseline highlighting.
- **Dark mode** — via `next-themes`; matches OS preference by default.
- **Progressive rendering** — status cards render immediately from `/api/vitals`; charts stream in from `/api/vitals?hours=24` with skeletons.
- **Auto-refresh** — latest snapshot every 15 s; history every 60 s.

---

## Architecture

```
Browser ──► /api/vitals   (Next.js Route Handler) ──► Metrics API (Bearer auth)
        ──► /api/health   (Next.js Route Handler) ──► api[-test].yariride.com/health
```

The Metrics API bearer token never reaches the browser. All upstream calls go through server-side Route Handlers, which read `METRICS_API_URL` and `METRICS_API_KEY` from the server environment.

The health-probe routes are unauthenticated on the upstream side (they are public health checks) but are wrapped with an 8-second timeout so a stalled upstream shows as *unreachable* instead of blocking the page.

The app is intended to run behind **Cloudflare Access** (Zero Trust), which handles authentication at the edge.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Charts | Recharts |
| Data fetching | SWR |
| Icons | lucide-react |
| Theming | next-themes |

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── health/route.ts       # server-side proxy to api[-test].yariride.com/health
│   │   └── vitals/route.ts       # server-side proxy to Metrics API
│   ├── health/page.tsx           # API Health page
│   ├── infra/page.tsx            # Infrastructure page
│   ├── housekeeping/page.tsx     # Housekeeping page
│   ├── security/page.tsx         # Security page
│   ├── layout.tsx                # root layout (sidebar + topbar + theme)
│   ├── page.tsx                  # Overview page
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   ├── ui/                       # shadcn primitives
│   ├── docker-table.tsx
│   ├── health-check-row.tsx
│   ├── host-card.tsx
│   ├── line-chart-card.tsx
│   ├── redis-detail-card.tsx
│   ├── security-card.tsx
│   ├── status-tile.tsx
│   ├── suggestion-card.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── warning-banner.tsx
└── lib/
    ├── fetcher.ts
    ├── hooks.ts
    ├── parse.ts
    ├── redis-parse.ts
    ├── types.ts
    └── utils.ts
```

---

## Getting started

### Prerequisites

- Node.js 20+
- Access to the Metrics API (URL + bearer token)

### Install

```
git clone git@github.com:rabishrestha/yariride-ops-dashboard.git
cd yariride-ops-dashboard
npm install
```

### Environment

Create `.env.local` in the project root:

```
METRICS_API_URL=https://metrics.yariride.com
METRICS_API_KEY=your_bearer_token_here
```

Both variables are **server-only** — they are read by the Route Handlers and never exposed to the client bundle.

### Develop

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Typecheck

```
npx tsc --noEmit
```

### Build & run

```
npm run build
npm start
```

---

## Deployment

Deployed to a private VPS, served through **Cloudflare Access**.

1. `npm run build` on the VPS.
2. Run under a process manager: `pm2 start npm --name yariride-ops -- start`.
3. Expose via `cloudflared` tunnel or nginx → `http://127.0.0.1:3000`.
4. Configure a Cloudflare Access policy on the dashboard hostname.
5. `src/proxy.ts` (or `middleware.ts`) only enforces the `cf-access-jwt-assertion` check when `NODE_ENV=production`, so local development is not blocked.

---

## API reference

### Metrics API (proxied by `/api/vitals`)

| Endpoint | Returns |
| --- | --- |
| `GET /api/vitals` | Latest single snapshot `{...}` |
| `GET /api/vitals?hours=24` | Array of snapshots `[{...}, ...]` |

All requests require `Authorization: Bearer <API_KEY>`. The proxy route handles that header; the browser never sees it.

### Health API (proxied by `/api/health`)

| Endpoint | Upstream | Returns |
| --- | --- | --- |
| `GET /api/health?env=prod` | `https://api.yariride.com/health` | Full health payload with parsed checks |
| `GET /api/health?env=test` | `https://api-test.yariride.com/health` | Full health payload with parsed checks |

Each response is enriched with `env`, `elapsed_ms`, and `checked_at` so the page can show round-trip latency and snapshot freshness. Upstream requests carry an 8-second timeout.

---

## Health check coverage

The dashboard surfaces roughly 55% of the raw `/health` JSON payload. What is rendered:

- **Top-level** — `status`, `version`, `uptime` (formatted as days/hours), HTTP code, round-trip ms, `check_duration`, `cache_ttl`, and `summary` counts.
- **Per-check** — `status`, `duration` (ms), `timestamp` (as "at HH:MM:SS").
- **Database read/write** — `in_use`, `open_connections`, `idle`, `max_open_connections`, `utilization`.
- **Redis** — used memory, peak %, RSS memory, fragmentation ratio (color-coded), allocator fragmentation, active defrag status, client count, maxmemory, eviction policy, plus an OOM-risk warning when `maxmemory=0` + `noeviction`.
- **WebSocket hub** — active connections (with "(idle)" hint when zero).

The remaining ~45% of the JSON is either redundant (multiple representations of the same number) or requires backend additions (build SHA, certificate expiry, disk check) to be useful. Those are tracked as future work against the metrics service.

---

## Roadmap

- [ ] Suspense-based streaming for the history charts
- [ ] Wire Housekeeping buttons to a signed `/api/actions` endpoint
- [ ] 30 s revalidation on `?hours=24` at the proxy layer
- [ ] Error log tail (`/api/logs?lines=N`)
- [ ] Sparklines inside status tiles
- [ ] Multi-host support (tabs per environment)
- [ ] Backend: add `build_sha`, `cert_expiry`, `disk_check` to `/health`
- [ ] Redis: alert when `maxmemory=0` and `eviction=noeviction` in production

---

## License

Private — internal Yarri Ride tooling. Not for redistribution.
