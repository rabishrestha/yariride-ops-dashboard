#!/usr/bin/env bash
# Easy Rider Vitals - Increment 6 (Sanitized JSON strings)
# Usage: ./vitals.sh [--json]
set -euo pipefail

OUTPUT_JSON=0
if [[ "${1:-}" == "--json" ]]; then
  OUTPUT_JSON=1
fi

# --- Helper functions (all sanitized with tr -d for JSON safety) ---
sanitize() { tr -d '\n\r\t' | sed 's/"/\\"/g'; }

get_time() { date -u +"%Y-%m-%dT%H:%M:%SZ" | sanitize; }
get_uptime() { uptime -p | sed 's/^up //; s/,$//' | sanitize; }
get_load() { awk '{print $1", "$2", "$3}' /proc/loadavg | sanitize; }
get_mem() { free -m | awk '/^Mem:/ {print $3" / "$2" MB"}' | sanitize; }
get_swap() { free -m | awk '/^Swap:/ {print $3" / "$2" MB"}' | sanitize; }
get_disk() { df -h "$1" | awk 'NR==2 {print $3" / "$2" ("$5")"}' | sanitize; }

# --- API Check ---
check_api() {
  local name=$1
  local port=$2
  local service="easy-rider-$name"
  
  local status=$(systemctl is-active "$service" 2>/dev/null | sanitize || echo "inactive")
  local mem=$(systemctl show -p MemoryCurrent "$service" 2>/dev/null | cut -d= -f2)
  local restarts=$(systemctl show -p NRestarts "$service" 2>/dev/null | cut -d= -f2 | sanitize)
  local since_raw=$(systemctl show -p ActiveEnterTimestamp "$service" 2>/dev/null | cut -d= -f2)
  local since=$(date -u -d "$since_raw" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null | sanitize || echo "")
  
  if [[ "$mem" == "[not set]" || -z "$mem" ]]; then mem=0; fi
  local mem_mb=$((mem / 1024 / 1024))

  local http_status="down"
  local http_time="0"
  
  if [[ "$status" == "active" ]]; then
    local start=$(date +%s%N)
    if curl -sf --max-time 5 "http://127.0.0.1:$port/health" > /dev/null 2>&1; then
      local end=$(date +%s%N)
      http_status="200 OK"
      http_time=$(( (end - start) / 1000000 ))
    else
      http_status="FAILED"
    fi
  fi

  if [[ $OUTPUT_JSON -eq 1 ]]; then
    echo -n "\"$name\": {\"status\":\"$status\",\"mem_mb\":$mem_mb,\"restarts\":$restarts,\"since\":\"$since\",\"http_status\":\"$http_status\",\"http_time_ms\":$http_time}"
  else
    echo "API ($name):"
    echo "  Status:    $status"
    echo "  Memory:    ${mem_mb} MB"
    echo "  Restarts:  $restarts"
    echo "  Health:    $http_status in ${http_time}ms"
    echo ""
  fi
}

# --- DB / Cache / Queue Checks ---
check_infra() {
  local pg_conns=$(docker exec -i yarri_backend-postgres-1 psql -U postgres -tAc "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | sanitize || echo "0")
  local pg_size_ride=$(docker exec -i yarri_backend-postgres-1 psql -U postgres -tAc "SELECT pg_size_pretty(pg_database_size('ride'));" 2>/dev/null | sanitize || echo "unknown")
  local pg_size_test=$(docker exec -i yarri_backend-postgres-1 psql -U postgres -tAc "SELECT pg_size_pretty(pg_database_size('ride_test'));" 2>/dev/null | sanitize || echo "unknown")

  local redis_mem=$(docker exec -i yarri_backend-redis-1 redis-cli info memory 2>/dev/null | grep '^used_memory_human:' | cut -d: -f2 | sanitize || echo "unknown")
  local redis_keys=$(docker exec -i yarri_backend-redis-1 redis-cli dbsize 2>/dev/null | sanitize || echo "0")
  local redis_test_mem=$(docker exec -i yarri_backend-redis-test-1 redis-cli info memory 2>/dev/null | grep '^used_memory_human:' | cut -d: -f2 | sanitize || echo "unknown")
  local redis_test_keys=$(docker exec -i yarri_backend-redis-test-1 redis-cli dbsize 2>/dev/null | sanitize || echo "0")

  local rmq_queues=$(docker exec -i yarri_backend-rabbitmq-1 rabbitmqctl -q list_queues name messages consumers 2>/dev/null | grep -v "Timeout" | grep -v "Listing" | grep -v "^$" || true)

  if [[ $OUTPUT_JSON -eq 1 ]]; then
    echo -n "\"postgres\": {\"active_conns\":$pg_conns,\"size_ride\":\"$pg_size_ride\",\"size_test\":\"$pg_size_test\"},"
    echo -n "\"redis_prod\": {\"mem\":\"$redis_mem\",\"keys\":$redis_keys},"
    echo -n "\"redis_test\": {\"mem\":\"$redis_test_mem\",\"keys\":$redis_test_keys},"
    
    if [[ -z "$rmq_queues" ]]; then
      echo -n "\"rabbitmq\": \"active\""
    else
      local rmq_clean=$(echo "$rmq_queues" | tr '\n' ' ' | tr -d '\r\t' | sed 's/"/\\"/g')
      echo -n "\"rabbitmq\": \"$rmq_clean\""
    fi
  else
    echo "PostgreSQL:"
    echo "  Active Conns: $pg_conns"
    echo "  Size (ride):  $pg_size_ride"
    echo "  Size (test):  $pg_size_test"
    echo ""
    echo "Redis (Prod :6379):"
    echo "  Memory:       $redis_mem"
    echo "  Keys:         $redis_keys"
    echo ""
    echo "Redis (Test :6380):"
    echo "  Memory:       $redis_test_mem"
    echo "  Keys:         $redis_test_keys"
    echo ""
    echo "RabbitMQ Queues:"
    if [[ -z "$rmq_queues" ]]; then
      echo "  (none or unreachable)"
    else
      echo "$rmq_queues" | awk '{printf "  %-30s %s msgs, %s consumers\n", $1, $2, $3}'
    fi
    echo ""
  fi
}

# --- Security Check ---
check_security() {
  local ssh_fails=$(journalctl -u ssh --since "24 hours ago" 2>/dev/null | grep -c "Failed password" | tr -d '\n\r\t' || echo "0")
  if [[ -z "$ssh_fails" ]]; then ssh_fails=0; fi
  
  local ports=$(ss -tln | awk '{print $4}' | grep -oE '[0-9]+$' | sort -n | uniq | tr '\n' ',' | sed 's/,$//' | tr -d '\n\r\t')

  if [[ $OUTPUT_JSON -eq 1 ]]; then
    echo -n "\"ssh_failed_24h\":$ssh_fails,\"listening_ports\":\"$ports\""
  else
    echo "Security:"
    echo "  SSH Failed Logins (24h): $ssh_fails"
    echo "  Listening Ports:         $ports"
    if [[ "$ssh_fails" -gt 100 ]]; then
      echo "  ⚠️  WARNING: High volume of failed SSH attempts."
    fi
    echo ""
  fi
}

# --- Cloudflare Tunnel Status Check ---
check_cloudflared() {
  local status=$(systemctl is-active cloudflared 2>/dev/null | tr -d '\n\r\t' || echo "inactive")
  local connections=0
  local protocol="unknown"

  if [[ "$status" == "active" ]]; then
    connections=$(journalctl -u cloudflared -n 200 --no-pager 2>/dev/null | grep -c "Registered tunnel connection" | tr -d '\n\r\t' || echo "0")
    if [[ -z "$connections" ]]; then connections=0; fi
    
    if journalctl -u cloudflared --since "1 hour ago" --no-pager 2>/dev/null | grep -q "Initial protocol http2"; then
      protocol="http2"
    elif journalctl -u cloudflared --since "1 hour ago" --no-pager 2>/dev/null | grep -q "Initial protocol quic"; then
      protocol="quic"
    fi
  fi

  if [[ $OUTPUT_JSON -eq 1 ]]; then
    echo -n "\"status\":\"$status\",\"connections\":$connections,\"protocol\":\"$protocol\""
  else
    echo "Cloudflare Tunnel:"
    echo "  Status:      $status"
    echo "  Connections: $connections registered"
    echo "  Protocol:    $protocol"
    echo ""
  fi
}

# --- Cloudflare Edge Latency Check ---
check_cloudflare_latency() {
  local prod_ttfb=0
  local test_ttfb=0

  local prod_res=$(curl -sf --max-time 5 -o /dev/null -w "%{time_starttransfer}" https://api.yariride.com/health 2>/dev/null || echo "0")
  if [[ "$prod_res" != "0" && -n "$prod_res" ]]; then
    prod_ttfb=$(awk -v t="$prod_res" 'BEGIN {printf "%.0f", t * 1000}')
  fi

  local test_res=$(curl -sf --max-time 5 -o /dev/null -w "%{time_starttransfer}" https://api-test.yariride.com/health 2>/dev/null || echo "0")
  if [[ "$test_res" != "0" && -n "$test_res" ]]; then
    test_ttfb=$(awk -v t="$test_res" 'BEGIN {printf "%.0f", t * 1000}')
  fi

  if [[ $OUTPUT_JSON -eq 1 ]]; then
    echo -n "\"prod_ttfb_ms\":$prod_ttfb,\"test_ttfb_ms\":$test_ttfb"
  else
    echo "Cloudflare Edge Latency (TTFB):"
    echo "  Prod: ${prod_ttfb}ms"
    echo "  Test: ${test_ttfb}ms"
    echo ""
  fi
}

# --- Docker Check ---
check_docker() {
  if ! command -v docker &> /dev/null; then return; fi
  local containers=$(docker ps --format '{{.Names}}|{{.Status}}' | grep -E 'yarri_backend|redis-test' || true)
  
  if [[ $OUTPUT_JSON -eq 1 ]]; then
    echo -n "\"docker\": {"
    local first=1
    if [[ -n "$containers" ]]; then
      while IFS='|' read -r name status; do
        [[ -z "$name" ]] && continue
        if [[ $first -eq 0 ]]; then echo -n ","; fi
        local clean_name=$(echo "$name" | sanitize)
        local clean_status=$(echo "$status" | sanitize)
        echo -n "\"$clean_name\": \"$clean_status\""
        first=0
      done <<< "$containers"
    fi
    echo -n "}"
  else
    echo "Docker Containers:"
    if [[ -z "$containers" ]]; then
      echo "  (none running)"
    else
      while IFS='|' read -r name status; do
        printf "  %-28s %s\n" "$name:" "$status"
      done <<< "$containers"
    fi
    echo ""
  fi
}

# --- Main Execution ---
if [[ $OUTPUT_JSON -eq 1 ]]; then
  echo "{"
  echo "  \"timestamp\": \"$(get_time)\","
  echo -n "  \"host\": {"
  echo -n "\"uptime\":\"$(get_uptime)\",\"load\":\"$(get_load)\","
  echo -n "\"mem\":\"$(get_mem)\",\"swap\":\"$(get_swap)\","
  echo -n "\"disk_root\":\"$(get_disk /)\",\"disk_opt\":\"$(get_disk /opt)\""
  echo "},"
  
  echo -n "  \"api\": {"
  echo -n "$(check_api prod 8080),"
  echo -n "$(check_api test 8081)"
  echo "},"
  
  echo -n "  \"infra\": {"
  echo -n "$(check_infra)"
  echo "},"
  
  echo -n "  \"security\": {"
  echo -n "$(check_security)"
  echo "},"
  
  echo -n "  \"cloudflared\": {"
  echo -n "$(check_cloudflared)"
  echo "},"
  
  echo -n "  \"cloudflare_latency\": {"
  echo -n "$(check_cloudflare_latency)"
  echo "},"
  
  echo -n "  "
  check_docker
  echo ""
  echo "}"
else
  echo "=================================================="
  echo " Easy Rider Vitals - $(get_time)"
  echo "=================================================="
  echo ""
  
  echo "Host:"
  echo "  Uptime:    $(get_uptime)"
  echo "  Load:      $(get_load)"
  echo "  Memory:    $(get_mem)"
  echo "  Swap:      $(get_swap)"
  echo "  Disk (/):  $(get_disk /)"
  echo "  Disk (/opt): $(get_disk /opt)"
  echo ""
  
  check_api prod 8080
  check_api test 8081
  check_infra
  check_security
  check_cloudflared
  check_cloudflare_latency
  check_docker
fi