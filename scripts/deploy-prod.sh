#!/usr/bin/env bash
# Blue/Green deployment for production backend
# Usage: IMAGE_TAG=<tag> DOCKERHUB_USERNAME=<username> ./deploy-prod.sh
set -euo pipefail

APP_DIR=/home/ubuntu/app
ACTIVE_FILE="$APP_DIR/.active_color"
COMPOSE_FILE="$APP_DIR/docker/docker-compose.prod.yml"
ENV_FILE="$APP_DIR/.env.prod"
UPSTREAM_CONF="$APP_DIR/nginx/upstream.conf"

IMAGE_TAG=${IMAGE_TAG:?IMAGE_TAG is required}
DOCKERHUB_USERNAME=${DOCKERHUB_USERNAME:?DOCKERHUB_USERNAME is required}

# ── Ensure infra is running ─────────────────────────────────────────────────
echo "==> Ensuring postgres and redis are running"
IMAGE_TAG="$IMAGE_TAG" DOCKERHUB_USERNAME="$DOCKERHUB_USERNAME" \
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

echo "==> Waiting for postgres to become healthy..."
"$APP_DIR/scripts/health-check.sh" love6202-postgres 20 3

# ── Ensure nginx is running with latest config ───────────────────────────────
echo "==> Ensuring nginx is up-to-date"
IMAGE_TAG="$IMAGE_TAG" DOCKERHUB_USERNAME="$DOCKERHUB_USERNAME" \
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate nginx

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
echo "==> Pulling image ${DOCKERHUB_USERNAME}/love6202-backend:${IMAGE_TAG}"
IMAGE_TAG="$IMAGE_TAG" DOCKERHUB_USERNAME="$DOCKERHUB_USERNAME" \
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull "backend-${NEW_COLOR}"

# ── Start new container ─────────────────────────────────────────────────────
echo "==> Starting $NEW_CONTAINER"
IMAGE_TAG="$IMAGE_TAG" DOCKERHUB_USERNAME="$DOCKERHUB_USERNAME" \
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps "backend-${NEW_COLOR}"

# ── Health check ────────────────────────────────────────────────────────────
echo "==> Waiting for $NEW_CONTAINER to become healthy..."
if ! "$APP_DIR/scripts/health-check.sh" "$NEW_CONTAINER" 20 5; then
    echo "✗ Health check failed — rolling back"
    docker stop "$NEW_CONTAINER" 2>/dev/null || true
    docker rm "$NEW_CONTAINER" 2>/dev/null || true
    echo "✓ Rollback complete — $ACTIVE_CONTAINER still active"
    exit 1
fi

# ── Switch nginx upstream (upstream 블록만 교체, HTTPS 설정 보존) ────────────
echo "==> Switching nginx upstream to $NEW_CONTAINER"
# sed -i 는 새 inode 파일로 교체하여 Docker bind mount가 구 inode를 계속 읽는 문제 발생.
# tee 는 기존 inode에 덮어써서 nginx 컨테이너에서 즉시 반영됨.
tee "$UPSTREAM_CONF" > /dev/null << UPSTREAM_EOF
upstream backend {
    server ${NEW_CONTAINER}:3000;
}
UPSTREAM_EOF

docker exec love6202-nginx nginx -s reload
echo "==> Nginx reloaded — traffic now routes to $NEW_CONTAINER"

# ── Stop old container ──────────────────────────────────────────────────────
echo "==> Stopping old container $ACTIVE_CONTAINER"
docker stop "$ACTIVE_CONTAINER" 2>/dev/null || true

# ── Persist new active color ────────────────────────────────────────────────
echo "$NEW_COLOR" > "$ACTIVE_FILE"
echo "==> Deployment complete — active=$NEW_COLOR (tag=$IMAGE_TAG)"
