#!/usr/bin/env bash
# Blue/Green deployment for production backend
# Usage: IMAGE_TAG=<tag> GITHUB_REPOSITORY=<owner/repo> ./deploy-prod.sh
set -euo pipefail

APP_DIR=/home/ubuntu/app
ACTIVE_FILE="$APP_DIR/.active_color"
COMPOSE_FILE="$APP_DIR/docker/docker-compose.prod.yml"
INFRA_FILE="$APP_DIR/docker/docker-compose.infra.yml"
UPSTREAM_CONF="$APP_DIR/nginx/upstream.conf"

IMAGE_TAG=${IMAGE_TAG:?IMAGE_TAG is required}
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}

# ── Determine active/new color ─────────────────────────────────────────────
ACTIVE_COLOR=$(cat "$ACTIVE_FILE" 2>/dev/null || echo "blue")
if [ "$ACTIVE_COLOR" = "blue" ]; then
    NEW_COLOR=green
else
    NEW_COLOR=blue
fi

ACTIVE_CONTAINER="love6202-backend-${ACTIVE_COLOR}"
NEW_CONTAINER="love6202-backend-${NEW_COLOR}"

echo "==> Deploying: active=$ACTIVE_COLOR → new=$NEW_COLOR (tag=$IMAGE_TAG)"

# ── Pull new image ──────────────────────────────────────────────────────────
echo "==> Pulling image ghcr.io/${GITHUB_REPOSITORY}/backend:${IMAGE_TAG}"
IMAGE_TAG="$IMAGE_TAG" GITHUB_REPOSITORY="$GITHUB_REPOSITORY" \
    docker compose -f "$INFRA_FILE" -f "$COMPOSE_FILE" pull "backend-${NEW_COLOR}"

# ── Start new container ─────────────────────────────────────────────────────
echo "==> Starting $NEW_CONTAINER"
IMAGE_TAG="$IMAGE_TAG" GITHUB_REPOSITORY="$GITHUB_REPOSITORY" \
    docker compose -f "$INFRA_FILE" -f "$COMPOSE_FILE" up -d "backend-${NEW_COLOR}"

# ── Health check ────────────────────────────────────────────────────────────
echo "==> Waiting for $NEW_CONTAINER to become healthy..."
if ! "$APP_DIR/scripts/health-check.sh" "$NEW_CONTAINER" 12 5; then
    echo "✗ Health check failed — rolling back"
    docker stop "$NEW_CONTAINER" 2>/dev/null || true
    docker rm "$NEW_CONTAINER" 2>/dev/null || true
    echo "✓ Rollback complete — $ACTIVE_CONTAINER still active"
    exit 1
fi

# ── Switch nginx upstream ───────────────────────────────────────────────────
echo "==> Switching nginx upstream to $NEW_CONTAINER"
cat > "$UPSTREAM_CONF" <<EOF
upstream backend {
    server ${NEW_CONTAINER}:3000;
}

server {
    listen 80;
    server_name _;

    location /api/ {
        limit_req zone=api burst=50 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }

    location / {
        return 404;
    }
}
EOF

docker exec love6202-nginx nginx -s reload
echo "==> Nginx reloaded — traffic now routes to $NEW_CONTAINER"

# ── Stop old container ──────────────────────────────────────────────────────
echo "==> Stopping old container $ACTIVE_CONTAINER"
docker stop "$ACTIVE_CONTAINER" 2>/dev/null || true

# ── Persist new active color ────────────────────────────────────────────────
echo "$NEW_COLOR" > "$ACTIVE_FILE"
echo "==> Deployment complete — active=$NEW_COLOR (tag=$IMAGE_TAG)"
