#!/usr/bin/env bash
# ====================================================================
# CI-EMS Credential Rotation Automation Script
# Usage: ./scripts/security/rotate-credentials.sh
# ====================================================================

set -euo pipefail

echo "=========================================================="
echo "    CI-EMS Security Credential Rotation Automation       "
echo "=========================================================="

# 1. PostgreSQL Database Password Rotation
echo ""
echo "[1/3] PostgreSQL Database Password Rotation"
read -rp "Enter NEW secure password for 'wemisico_adminuser' (leave empty to generate random): " NEW_DB_PASS
if [ -z "$NEW_DB_PASS" ]; then
    NEW_DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9!#$%' | head -c 20)
    echo "Generated secure DB password: $NEW_DB_PASS"
fi

echo "To rotate PostgreSQL password on your database host, execute:"
cat <<EOF

  psql -U postgres -c "ALTER USER wemisico_adminuser WITH PASSWORD '$NEW_DB_PASS';"

EOF

read -rp "Would you like to update your local .env with this new DB password? (y/N): " UPDATE_ENV
if [[ "$UPDATE_ENV" =~ ^[Yy]$ ]]; then
    if [ -f .env ]; then
        sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASS/" .env
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://wemisico_adminuser:$NEW_DB_PASS@localhost:5432/wemisico_ems|" .env
        rm -f .env.bak
        echo "Updated .env with new DB_PASSWORD and DATABASE_URL."
    else
        echo "No .env found in current directory. Please copy .env.example to .env."
    fi
fi

# 2. Google Maps API Key Rotation (Google Cloud CLI)
echo ""
echo "[2/3] Google Maps Platform API Key Rotation"
echo "To provision a restricted new Google Maps key using gcloud CLI:"
cat <<'EOF'

  # 1. Create a restricted replacement key
  gcloud services api-keys create \
    --display-name="EMS-Google-Maps-Key-Rotated" \
    --allowed-referrers="https://kuratech.site/*,https://ops-konsole.kuratech.site/*,http://localhost:*,http://ops-konsole.localhost:*" \
    --api-target=service=maps-backend.googleapis.com,places-backend.googleapis.com,geocoding-backend.googleapis.com

  # 2. List keys to identify the old compromised key UID
  gcloud services api-keys list

  # 3. Delete the compromised key
  gcloud services api-keys delete <OLD_KEY_UID_OR_NAME>

EOF

read -rp "Enter your NEW Google Maps Platform API key (or press Enter to skip): " NEW_MAPS_KEY
if [ -n "$NEW_MAPS_KEY" ]; then
    if [ -f .env ]; then
        sed -i.bak "s/^VITE_GOOGLE_MAPS_API_KEY=.*/VITE_GOOGLE_MAPS_API_KEY=$NEW_MAPS_KEY/" .env
        sed -i.bak "s/^VITE_GOOGLE_MAPS_PLATFORM_KEY=.*/VITE_GOOGLE_MAPS_PLATFORM_KEY=$NEW_MAPS_KEY/" .env
        sed -i.bak "s/^GOOGLE_MAPS_PLATFORM_KEY=.*/GOOGLE_MAPS_PLATFORM_KEY=\"$NEW_MAPS_KEY\"/" .env
        rm -f .env.bak
        echo "Updated .env with new Google Maps keys."
    fi
fi

# 3. Production Deployment Notice
echo ""
echo "[3/3] Production VPS Deployment Handoff"
cat <<'EOF'
To sync the updated secrets to your production VPS:
  1. SSH into VPS: ssh ubuntu@kuratech.site
  2. Update /var/www/ems/.env with the new credentials.
  3. Restart backend service:
     pm2 restart ems-server || sudo systemctl restart ems-backend
EOF

echo ""
echo "Credential rotation helper completed."
