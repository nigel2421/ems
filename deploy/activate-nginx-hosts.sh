#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "This helper must run as root." >&2
  exit 1
fi

SOURCE_DIR="/var/www/kutatech-api/deploy/nginx"
AVAILABLE_DIR="/etc/nginx/sites-available"
ENABLED_DIR="/etc/nginx/sites-enabled"

for site in kuratech.site ops-konsole.kuratech.site; do
  source_file="${SOURCE_DIR}/${site}.conf"
  [[ -r "$source_file" ]] || { echo "Missing Nginx config: $source_file" >&2; exit 1; }
  install -m 0644 "$source_file" "${AVAILABLE_DIR}/${site}.conf"
  ln -sfn "${AVAILABLE_DIR}/${site}.conf" "${ENABLED_DIR}/${site}.conf"
done

nginx -t
systemctl reload nginx
echo "Activated kuratech.site and ops-konsole.kuratech.site Nginx hosts."
