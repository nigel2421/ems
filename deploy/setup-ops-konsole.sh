#!/bin/bash
# ====================================================================
# Kuratech EMS - Dedicated Operations Console Subdomain Setup
# Subdomain: ops-konsole.kuratech.site
# Target Root: /var/www/ems/dist (index admin.html)
# ====================================================================

set -e

echo "=== [1/5] Checking Prerequisites & Installing Certbot ==="
if ! command -v nginx >/dev/null 2>&1; then
    echo "Installing nginx..."
    apt-get update && apt-get install -y nginx
fi

if ! command -v certbot >/dev/null 2>&1; then
    echo "Installing certbot and python3-certbot-nginx..."
    apt-get update && apt-get install -y certbot python3-certbot-nginx
fi

mkdir -p /var/www/certbot
mkdir -p /var/www/ems/dist
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

echo "=== [2/5] Disabling Default Catch-All Nginx Welcome Site ==="
# Remove default site that intercepts port 80 and serves 'Welcome to nginx!'
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
    echo "Removed /etc/nginx/sites-enabled/default"
fi

echo "=== [3/5] Obtaining Let's Encrypt SSL Certificate ==="
# Check if certificate already exists
if [ ! -f /etc/letsencrypt/live/ops-konsole.kuratech.site/fullchain.pem ]; then
    echo "Requesting SSL certificate for ops-konsole.kuratech.site..."
    
    # Temporarily ensure port 80 ACME location is serving
    cat << 'EOF' > /etc/nginx/sites-available/ops-konsole-temp.conf
server {
    listen 80;
    listen [::]:80;
    server_name ops-konsole.kuratech.site;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        root /var/www/ems/dist;
        index admin.html;
        try_files $uri $uri/ /admin.html;
    }
}
EOF
    ln -sf /etc/nginx/sites-available/ops-konsole-temp.conf /etc/nginx/sites-enabled/ops-konsole.kuratech.site.conf
    nginx -t && systemctl reload nginx

    # Run Certbot webroot validation
    certbot certonly --webroot -w /var/www/certbot \
        -d ops-konsole.kuratech.site \
        --non-interactive --agree-tos --register-unsafely-without-email || \
    certbot certonly --nginx -d ops-konsole.kuratech.site \
        --non-interactive --agree-tos --register-unsafely-without-email

    rm -f /etc/nginx/sites-available/ops-konsole-temp.conf
else
    echo "Certificate for ops-konsole.kuratech.site already exists at /etc/letsencrypt/live/ops-konsole.kuratech.site/."
fi

# Ensure options-ssl-nginx.conf and ssl-dhparams.pem exist if referenced
if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
    cat << 'EOF' > /etc/letsencrypt/options-ssl-nginx.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384";
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;
EOF
fi

if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
    openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

echo "=== [4/5] Activating Production ops-konsole.kuratech.site Nginx Site ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_SRC="$SCRIPT_DIR/nginx/ops-konsole.kuratech.site.conf"

if [ -f "$CONF_SRC" ]; then
    cp "$CONF_SRC" /etc/nginx/sites-available/ops-konsole.kuratech.site.conf
else
    # Fallback if run standalone without git repository context
    cat << 'EOF' > /etc/nginx/sites-available/ops-konsole.kuratech.site.conf
server {
    listen 80;
    listen [::]:80;
    server_name ops-konsole.kuratech.site;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ops-konsole.kuratech.site;

    ssl_certificate /etc/letsencrypt/live/ops-konsole.kuratech.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ops-konsole.kuratech.site/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/ems/dist;
    index admin.html;

    add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "same-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }

    location ~* \.(?:css|js|woff2?|svg|png|jpg|jpeg|gif|ico|webp)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    location / {
        try_files $uri $uri/ /admin.html;
    }
}
EOF
fi

ln -sf /etc/nginx/sites-available/ops-konsole.kuratech.site.conf /etc/nginx/sites-enabled/ops-konsole.kuratech.site.conf

echo "=== [5/5] Validating Nginx Syntax & Reloading Service ==="
nginx -t
systemctl reload nginx

echo ""
echo "===================================================================="
echo " SUCCESS: ops-konsole.kuratech.site is LIVE with HTTPS!"
echo " URL: https://ops-konsole.kuratech.site"
echo " Entry Point: /var/www/ems/dist/admin.html"
echo " Backend API: http://127.0.0.1:5000/api/"
echo "===================================================================="
