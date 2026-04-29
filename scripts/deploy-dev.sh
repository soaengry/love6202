#!/usr/bin/env bash
# Rolling deploy for dev environment
# Usage: IMAGE_TAG=<tag> DOCKERHUB_USERNAME=<username> ./deploy-dev.sh
set -euo pipefail

APP_DIR=/home/ubuntu/app
COMPOSE_FILE="$APP_DIR/docker/docker-compose.dev.yml"
ENV_FILE="$APP_DIR/.env.dev"

IMAGE_TAG=${IMAGE_TAG:?IMAGE_TAG is required}
DOCKERHUB_USERNAME=${DOCKERHUB_USERNAME:?DOCKERHUB_USERNAME is required}

# ── Ensure infra is running ─────────────────────────────────────────────────
echo "==> Ensuring postgres and redis are running"
IMAGE_TAG="$IMAGE_TAG" DOCKERHUB_USERNAME="$DOCKERHUB_USERNAME" \
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

# ── Pull new image ──────────────────────────────────────────────────────────
echo "==> Pulling image ${DOCKERHUB_USERNAME}/love6202-backend:${IMAGE_TAG}"
IMAGE_TAG="$IMAGE_TAG" DOCKERHUB_USERNAME="$DOCKERHUB_USERNAME" \
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull backend

# ── Restart backend with new image ─────────────────────────────────────────
echo "==> Restarting love6202-backend-dev"
IMAGE_TAG="$IMAGE_TAG" DOCKERHUB_USERNAME="$DOCKERHUB_USERNAME" \
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps backend

# ── Health check ────────────────────────────────────────────────────────────
echo "==> Waiting for love6202-backend-dev to become healthy..."
if ! "$APP_DIR/scripts/health-check.sh" love6202-backend-dev 12 5; then
    echo "✗ Health check failed — dev deploy unsuccessful"
    exit 1
fi

echo "==> Dev deployment complete (tag=$IMAGE_TAG)"
