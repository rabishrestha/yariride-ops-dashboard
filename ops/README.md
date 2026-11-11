# Ops Scripts — Easy Rider Server Maintenance

Lives in `yariride-ops-dashboard/ops/`. Version-controlled for backup and history. Deployed manually to the API server.

## Why Version These Scripts in Git?

- **Backup:** If the server dies, the scripts can be restored from this repo.
- **History:** `git log` shows who changed what and when.
- **Review:** Changes to production scripts can be reviewed before deploying.

  Do not edit on the server Edit scripts here in the repo, commit, and upload the new version manually. That way the repo remains the source of truth. Editing on the server means the repo and server drift, and the "backup" is useless.

## vitals.sh

| **Location on server** | `/opt/easy-rider/ops/vitals.sh` |
| --- | --- |
| **Cron schedule** | Every 5 minutes, owned by user `apf` |
| **Cron command** | `*/5 * * * * umask 022; /opt/easy-rider/ops/vitals.sh --json \| jq -c . >> /var/log/easy-rider/vitals.jsonl` |
| **Purpose** | Collects host, API, database, Cloudflare, and security metrics |
| **Output modes** | `vitals.sh` (text) or `vitals.sh --json` (JSON object) |
| **Data consumer** | `easy-rider-metrics` Go API at `https://metrics.yariride.com/api/vitals` |

## Manual Deployment (No CI/CD)

### 1. Edit locally, commit, push

```
# On your laptop
cd ~/node_projects/yariride-ops-dashboard
nano ops/vitals.sh
git add ops/vitals.sh
git commit -m "fix: describe what changed"
git push origin main
```

### 2. Upload to server via scp

```
scp ops/vitals.sh apf@100.66.193.15:/tmp/vitals.sh
```

### 3. Install on server

```
ssh apf@100.66.193.15

# Back up the current version first
sudo cp /opt/easy-rider/ops/vitals.sh /opt/easy-rider/ops/vitals.sh.bak

# Install the new version
sudo cp /tmp/vitals.sh /opt/easy-rider/ops/vitals.sh
sudo chmod 755 /opt/easy-rider/ops/vitals.sh
rm /tmp/vitals.sh
```

### 4. Verify the script is valid (critical)

```
# Test text output
/opt/easy-rider/ops/vitals.sh

# Test JSON output is parseable
/opt/easy-rider/ops/vitals.sh --json | jq '.'
```

  If jq fails, roll back immediately A broken script means the cron job will keep appending invalid data to `vitals.jsonl`, which breaks the Go API and the dashboard. Restore the backup:

```
sudo cp /opt/easy-rider/ops/vitals.sh.bak /opt/easy-rider/ops/vitals.sh
```

 Never leave an unverified script on the server.

## Generating a Fresh Data Point

If you want to immediately test the pipeline without waiting for cron:

```
/opt/easy-rider/ops/vitals.sh --json | jq -c . >> /var/log/easy-rider/vitals.jsonl
```

Then verify the API sees it:

```
curl -s -H "Authorization: Bearer YOUR_METRICS_KEY" \
  https://metrics.yariride.com/api/vitals | jq '.timestamp'
```

## Clearing History (When Schema Changes)

If you change the JSON structure (e.g., add a new field like `cloudflare_latency`), old log lines will have a different shape than new ones. This breaks the Go API's `?hours=` filtering, which expects every line to have the same structure.

```
# Truncate the log (empties the file, keeps it)
> /var/log/easy-rider/vitals.jsonl

# Generate the first valid line
/opt/easy-rider/ops/vitals.sh --json | jq -c . >> /var/log/easy-rider/vitals.jsonl

# Verify
wc -l /var/log/easy-rider/vitals.jsonl   # Should be 1
tail -n 1 /var/log/easy-rider/vitals.jsonl | jq '.host'
```

  Timing matters Do not truncate during peak hours if the dashboard is being actively viewed — you'll see a gap in the charts for up to 5 minutes until cron catches up.

## What the Script Collects

| Section | Metrics |
| --- | --- |
| `host` | Uptime, load average (1m/5m/15m), memory, swap, disk usage (`/` and `/opt`) |
| `api` | Status, memory, restart count, uptime, HTTP health response time for prod and test |
| `infra` | PostgreSQL (active connections, DB sizes), Redis (memory, keys), RabbitMQ (queue depths) |
| `security` | Failed SSH logins (24h), listening ports |
| `cloudflared` | Tunnel service status, registered connections, protocol (http2/quic) |
| `cloudflare_latency` | TTFB for prod and test (measured via curl) |
| `docker` | Container names and status for all `yarri_backend-*` and `redis-test` containers |

### Notes on measurement methods

- **`http_time_ms` (inside `api`)** — round trip from the server itself (localhost). This is the "server is fast" number, usually around 8ms.
- **`prod_ttfb_ms` (inside `cloudflare_latency`)** — round trip from server → Cloudflare edge → back to server. This is the number that spikes to ~20,000ms when Cloudflare's edge routing is slow.

  Diagnostic rule If `http_time_ms` is 8ms but `prod_ttfb_ms` is 20,000ms, the delay is entirely in Cloudflare, not the server or the app.

## Common Failures and Fixes

### parse error: Expected separator between values

The script generated invalid JSON. Most often caused by:

- A raw newline or tab inside a string value
- A shell command that output an error message mixed with data

**Fix:** Check which line fails with `vitals.sh --json | head -n 20`. Look for missing commas, stray newlines, or unclosed quotes. Every `$variable` should be sanitized with `tr -d '\n\r\t'`.

### parse error: Invalid string: control characters

A string contains a literal control character (usually `\n` or `\t`).

**Fix:** Wrap the offending variable with `| sanitize`, where `sanitize() { tr -d '\n\r\t' | sed 's/"/\\"/g'; }`.

### Failed to read vitals data (from the Go API)

The `vitals.jsonl` file doesn't exist, is empty, or has permission issues.

```
ls -l /var/log/easy-rider/vitals.jsonl
# Should exist, owned by apf:apf, readable (644)

# If missing:
/opt/easy-rider/ops/vitals.sh --json | jq -c . > /var/log/easy-rider/vitals.jsonl

# If permission issue:
sudo chown apf:apf /var/log/easy-rider/vitals.jsonl
sudo chmod 644 /var/log/easy-rider/vitals.jsonl
```

### No valid JSON data found in vitals log (from the Go API)

The Go API's backward search (looking for the most recent valid JSON line) failed. This means every line in the file is broken.

**Fix:** Same as above — truncate and regenerate.

### prod_ttfb_ms is very high (10,000ms+)

This is the Cloudflare edge-routing issue. It is not a script bug and not a server problem.

**Verify:** Check `http_time_ms` in the same log line. If it's low (<100ms), the server is fine and Cloudflare is slow.

**Workaround:** Enable Argo Smart Routing on Cloudflare, or migrate to a direct connection (Nginx on 80/443) once the VPS provider unblocks those ports.

## Related Repos and Services

| Component | Repo / Location |
| --- | --- |
| This repo (scripts + dashboard) | `Black-Pearl-Nepal/yariride-ops-dashboard` |
| Go Metrics API | `Black-Pearl-Nepal/easy-rider-metrics` — deployed at `https://metrics.yariride.com` |
| Main API (prod + test) | `Black-Pearl-Nepal/Yarri_Backend` — deployed at `/opt/easy-rider/{prod,test}` |
| Server access | `ssh apf@100.66.193.15` (via Tailscale) |
