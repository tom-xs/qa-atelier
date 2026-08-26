#!/usr/bin/env bash
# Restart the RWA with a freshly seeded database, warm up the dev server,
# then run the Cypress suite.
#
# Why: the RWA keeps its JSON database in memory, so a reseed only takes
# effect on server restart — a reset must happen *around* a run, never
# mid-suite. This mirrors what CI gets for free (yarn start reseeds) and
# avoids two local-only failure modes: state drift across repeated runs
# (e.g. balances draining toward zero) and first-compile warmup, where the
# dev server serves partially styled pages (the "covered by NavBar-toolbar"
# flake).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RWA_DIR="$ROOT/apps/rwa"
CYPRESS_DIR="$ROOT/web/cypress"

rwa_pid=""
cleanup() {
  if [[ -n "$rwa_pid" ]]; then
    kill "$rwa_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Stop anything already listening on the RWA ports — otherwise the reseed
# silently doesn't happen and we'd be testing against stale state.
if command -v lsof >/dev/null 2>&1; then
  for port in 3000 3001; do
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      echo "Stopping existing process on :$port"
      kill $pids 2>/dev/null || true
    fi
  done
fi

# yarn start -> prestart -> db:seed:dev: server comes up with a fresh DB.
echo "Starting RWA (reseeding database)..."
(cd "$RWA_DIR" && yarn start) &
rwa_pid=$!

# Health check: the API accepting a login proves the server is up AND the
# seed data is present.
echo "Waiting for RWA API on :3001..."
up=""
for _ in $(seq 1 60); do
  if curl -sf -X POST http://localhost:3001/login \
      -H 'Content-Type: application/json' \
      -d '{"username":"Heath93","password":"s3cret"}' >/dev/null 2>&1; then
    up=1
    break
  fi
  sleep 2
done
if [[ -z "$up" ]]; then
  echo "ERROR: RWA API did not come up on :3001 within 120s" >&2
  exit 1
fi

# Warm up the frontend: trigger webpack's first compile BEFORE the first
# spec, so no test ever sees a partially styled page.
echo "Warming up RWA frontend on :3000..."
for _ in $(seq 1 30); do
  if curl -s -o /dev/null http://localhost:3000; then
    break
  fi
  sleep 2
done
curl -s -o /dev/null http://localhost:3000/signin || true

echo "Running Cypress..."
cd "$CYPRESS_DIR" && npx cypress run "$@"
