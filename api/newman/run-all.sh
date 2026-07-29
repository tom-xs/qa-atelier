#!/usr/bin/env bash
# Runs every Postman collection in api/collections/ with Newman.
# Exits 0 (with a notice) when no collections exist yet, so CI stays green
# while the suite is being built. Secrets come from env vars, never files.
set -euo pipefail
shopt -s nullglob

ENV_FILE="api/environments/ci.postman_environment.json"
collections=(api/collections/*.postman_collection.json)

if [ ${#collections[@]} -eq 0 ]; then
  echo "No Postman collections found in api/collections/ — skipping."
  exit 0
fi

env_args=()
if [ -f "$ENV_FILE" ]; then
  env_args+=(--environment "$ENV_FILE")
  env_args+=(--env-var "RWA_PASS=${RWA_PASS:-s3cret}")
else
  echo "WARNING: $ENV_FILE not found — running without an environment file."
fi

mkdir -p api/reports

for collection in "${collections[@]}"; do
  name=$(basename "$collection" .postman_collection.json)
  echo "Running: $collection"
  npx newman run "$collection" \
    "${env_args[@]}" \
    --reporters cli,junit \
    --reporter-junit-export "api/reports/${name}.xml"
done
