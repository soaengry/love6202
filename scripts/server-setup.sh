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
mkdir -p "$APP_DIR"/{data/{postgres,postgres-dev,redis,redis-dev,certbot-webroot},nginx,scripts,docker/postgres,frontend/dist}

echo "==> Creating env file placeholders (fill these in!)"
touch "$APP_DIR/.env.prod" "$APP_DIR/.env.dev"
chmod 600 "$APP_DIR/.env.prod" "$APP_DIR/.env.dev"

echo "==> Setting initial active color to blue"
echo "blue" > "$APP_DIR/.active_color"

echo ""
echo "==================================================================="
echo "Setup complete! Next steps:"
echo ""
echo "  1. Fill in env files:"
echo "       $APP_DIR/.env.prod"
echo "       $APP_DIR/.env.dev"
echo ""
echo "  2. Install certbot and issue SSL certificate for the primary domains"
echo "     (nginx isn't running yet, so port 80 is free — use standalone once):"
echo "       sudo apt install certbot"
echo "       sudo certbot certonly --standalone \\"
echo "         -d love6202.cloud \\"
echo "         -d api.love6202.cloud"
echo ""
echo "  3. Push to dev or main branch to trigger GitHub Actions deployment"
echo "     (scripts, docker configs, nginx configs are copied automatically)"
echo ""
echo "  4. For manual first-time prod startup after first deploy:"
echo "       docker compose -f $APP_DIR/docker/docker-compose.prod.yml --env-file $APP_DIR/.env.prod up -d"
echo ""
echo "  5. Switch the cert to the webroot authenticator so future renewals"
echo "     don't need nginx to be stopped (nginx already serves"
echo "     /.well-known/acme-challenge/ from \$APP_DIR/data/certbot-webroot):"
echo "       sudo certbot certonly --webroot -w $APP_DIR/data/certbot-webroot \\"
echo "         -d love6202.cloud -d api.love6202.cloud"
echo ""
echo "  6. Install the renewal deploy hook (reloads nginx after a successful renew):"
echo "       sudo cp $APP_DIR/scripts/certbot-deploy-hook.sh /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh"
echo "       sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh"
echo ""
echo "  7. Confirm the certbot systemd timer is enabled (installed by apt automatically):"
echo "       systemctl status certbot.timer"
echo "       sudo certbot renew --dry-run"
echo ""
echo "  Required GitHub Secrets:"
echo "    DOCKERHUB_USERNAME, DOCKERHUB_TOKEN"
echo "    EC2_HOST, EC2_SSH_KEY"
echo "    DOMAIN (prod only, for SSL cert path — love6202.soaengry.com)"
echo "    VITE_OAUTH2_BASE_URL, VITE_KAKAO_MAP_KEY"
echo "==================================================================="
