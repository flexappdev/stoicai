#!/usr/bin/env bash
# Run enrich.ts in 1000-item passes until none left. Stops when a pass
# enriches 0 items (i.e. nothing remains with themes='{}' && q=50).
set -uo pipefail

cd "$(dirname "$0")/.."

while true; do
  out=$(npx tsx scripts/enrich.ts --limit 1000 --batch 10 2>&1)
  echo "$out" | tail -5
  if echo "$out" | grep -qE "nothing to enrich|✓ enriched 0/"; then
    echo "✓ enrich-loop: done"
    break
  fi
  if echo "$out" | grep -qE "✓ updated 0 rows"; then
    echo "✓ enrich-loop: no more updates"
    break
  fi
  echo "—— pass complete, sleeping 5s ——"
  sleep 5
done
