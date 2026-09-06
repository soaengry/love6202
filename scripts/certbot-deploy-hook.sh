#!/usr/bin/env bash
# Certbot renewal deploy hook — reloads nginx after any certificate renews.
# Install: copy (or symlink) to /etc/letsencrypt/renewal-hooks/deploy/ on the host.
#   sudo cp scripts/certbot-deploy-hook.sh /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
#   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
set -euo pipefail

docker exec love6202-nginx nginx -s reload
