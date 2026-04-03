#!/usr/bin/env bash
# One-time EC2 server setup for love6202 backend
# Run as ubuntu user: bash server-setup.sh
set -euo pipefail

APP_DIR=/home/ubuntu/app

echo "==> Updating system packages"
sudo apt-get update -y && sudo apt-get upgrade -y

echo "==> Installing Docker"
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

echo "==> Creating directory structure"
mkdir -p "$APP_DIR"/{data/{postgres,postgres-dev,redis,redis-dev},nginx,scripts,docker/postgres}

echo "==> Copying config files (run from repo root)"
# These should be copied from the repo after cloning:
# cp docker/docker-compose.infra.yml   $APP_DIR/docker/
# cp docker/docker-compose.prod.yml    $APP_DIR/docker/
# cp docker/docker-compose.dev.yml     $APP_DIR/docker/
# cp docker/postgres/init.sql          $APP_DIR/docker/postgres/
# cp docker/nginx/nginx.conf           $APP_DIR/nginx/
# cp docker/nginx/upstream.conf        $APP_DIR/nginx/
# cp scripts/health-check.sh          $APP_DIR/scripts/
# cp scripts/deploy-prod.sh           $APP_DIR/scripts/
# cp scripts/deploy-dev.sh            $APP_DIR/scripts/
chmod +x "$APP_DIR"/scripts/*.sh 2>/dev/null || true

echo "==> Creating Docker network"
docker network create love6202-net 2>/dev/null || echo "  Network already exists"

echo "==> Creating env file placeholders (fill these in!)"
touch "$APP_DIR/.env.prod" "$APP_DIR/.env.dev"
chmod 600 "$APP_DIR/.env.prod" "$APP_DIR/.env.dev"

echo "==> Setting active color to blue"
echo "blue" > "$APP_DIR/.active_color"

echo ""
echo "==================================================================="
echo "Setup complete! Next steps:"
echo "  1. Fill in $APP_DIR/.env.prod and $APP_DIR/.env.dev"
echo "  2. Copy config files from the repository"
echo "  3. Start infra: docker compose -f $APP_DIR/docker/docker-compose.infra.yml up -d"
echo "  4. Log in to GHCR:  echo \$GHCR_TOKEN | docker login ghcr.io -u <username> --password-stdin"
echo "  5. Add GitHub secrets: EC2_HOST, EC2_SSH_KEY, GHCR_TOKEN (or use GITHUB_TOKEN)"
echo "==================================================================="
