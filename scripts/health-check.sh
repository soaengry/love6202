#!/usr/bin/env bash
# Usage: ./health-check.sh <container_name> [retries] [interval_seconds]
set -euo pipefail

CONTAINER=${1:?container name required}
RETRIES=${2:-20}
INTERVAL=${3:-5}

echo "Health-checking $CONTAINER (max ${RETRIES} retries, ${INTERVAL}s interval)..."

for i in $(seq 1 "$RETRIES"); do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "not-found")

    if [ "$STATUS" = "healthy" ]; then
        echo "✓ $CONTAINER is healthy"
        exit 0
    fi

    echo "  [$i/$RETRIES] status=$STATUS — waiting ${INTERVAL}s..."
    sleep "$INTERVAL"
done

echo "✗ $CONTAINER did not become healthy after $((RETRIES * INTERVAL))s"
exit 1
