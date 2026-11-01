# Kuratech EMS — Production Deployment & Handoff Handbook

This operational handbook outlines the exact steps for deploying and maintaining the dual-domain architecture on your production Ubuntu/Debian VPS.

---

## 1. Architecture Overview

| Component | Main Campaign Domain | Dedicated Operations Console |
| :--- | :--- | :--- |
| **FQDN** | `kuratech.site` | `ops-konsole.kuratech.site` |
| **Target Audience** | Governors, Senators, MPs, MCAs, Agents, Observers | Super Admin, System Administrators |
| **Static Entry Point** | `/var/www/ems/dist/index.html` | `/var/www/ems/dist/admin.html` |
| **Search Indexing** | Allowed (`robots.txt`, dynamic sitemap) | Strict anti-indexing (`noindex, nofollow, noarchive`) |
| **Backend API** | Reverse proxied to `127.0.0.1:5000/api/` | Reverse proxied to `127.0.0.1:5000/api/` |
| **Auth Realm** | `user` | `admin` |
| **Cross-Realm Policy** | Admins attempting login here are **DENIED (401)** | Regular users attempting login here are **DENIED (401)** |

---

## 2. DNS Configuration (Do This First)

In your DNS provider (Cloudflare, Namecheap, etc.), add the following DNS records pointing to your VPS public IPv4:

| Type | Host / Name | Target / Value | TTL | Proxy Status |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (`kuratech.site`) | `<YOUR_VPS_IP>` | Auto / 300 | DNS Only (or Proxied) |
| **A** | `www` | `<YOUR_VPS_IP>` | Auto / 300 | DNS Only (or Proxied) |
| **A** | `ops-konsole` | `<YOUR_VPS_IP>` | Auto / 300 | DNS Only (or Proxied) |

> **Note**: Wait 2–5 minutes for DNS propagation before running Certbot.

---

## 3. Directory & Permission Setup on VPS

Run the following on the VPS as root or sudoer:

```bash
# 1. Create directory structure
sudo mkdir -p /var/www/ems/dist
sudo mkdir -p /var/lib/ems
sudo mkdir -p /var/log/ems
sudo mkdir -p /var/www/certbot

# 2. Restrict secure data store to node process owner (e.g., ubuntu or root)
sudo chown -R $USER:$USER /var/lib/ems /var/log/ems /var/www/ems
sudo chmod 700 /var/lib/ems
```

---

## 4. SSL Certificate Provisioning (Let's Encrypt / Certbot)

Install and run Certbot to obtain certificates for both domains:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate for main campaign domain
sudo certbot certonly --webroot -w /var/www/certbot -d kuratech.site -d www.kuratech.site

# Obtain certificate for operations console subdomain
sudo certbot certonly --webroot -w /var/www/certbot -d ops-konsole.kuratech.site
```

---

## 5. Nginx Server Configuration

Copy the server block configs from `deploy/nginx/` into `/etc/nginx/sites-available/`:

```bash
sudo cp deploy/nginx/kuratech.site.conf /etc/nginx/sites-available/kuratech.site.conf
sudo cp deploy/nginx/ops-konsole.kuratech.site.conf /etc/nginx/sites-available/ops-konsole.kuratech.site.conf

# Enable both sites
sudo ln -sf /etc/nginx/sites-available/kuratech.site.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/ops-konsole.kuratech.site.conf /etc/nginx/sites-enabled/

# Test syntax and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Backend Deployment via PM2

1. In your repository on the VPS:
```bash
npm ci --production=false
```

2. Seed initial production users (or create specific accounts):
```bash
# Seed default dev persona baseline to /var/lib/ems/users.json
EMS_DATA_DIR=/var/lib/ems node scripts/seed-dev-users.mjs

# Or create a custom dedicated production administrator:
EMS_DATA_DIR=/var/lib/ems node scripts/create-user.mjs \
  --email="admin.production@kuratech.site" \
  --name="Chief Systems Architect" \
  --role="Super Admin" \
  --password="YourSecureProductionPassword123!"
```

3. Launch backend process with PM2:
```bash
sudo npm install -g pm2
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

Check status:
```bash
pm2 status
pm2 logs ems-backend
```

---

## 7. Frontend Build & Deploy

Whenever you deploy new code:

```bash
# 1. Build multi-page bundle
npm run build

# 2. Sync distribution assets to Nginx webroot
sudo rsync -av --delete dist/ /var/www/ems/dist/

# 3. Ensure permissions are valid
sudo chown -R www-data:www-data /var/www/ems/dist
sudo chmod -R 755 /var/www/ems/dist
```

---

## 8. Verification & Smoke Testing Checklist

Run these curl commands directly on the VPS or your workstation to confirm security isolation:

### Test 1: Admin Attempting Login on Main User Domain (`kuratech.site`)
```bash
curl -i -X POST https://kuratech.site/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: kuratech.site" \
  -d '{"email":"admin.super@ems.go.ke","password":"dev-local-only-password"}'
```
**Expected Outcome**: `HTTP/1.1 401 Unauthorized` with generic message:
`{"success":false,"error":"Invalid email address or password credentials."}`
Audit log records: `ADMIN_LOGIN_WRONG_DOMAIN`.

### Test 2: Admin Logging in on Operations Subdomain (`ops-konsole.kuratech.site`)
```bash
curl -i -X POST https://ops-konsole.kuratech.site/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: ops-konsole.kuratech.site" \
  -d '{"email":"admin.super@ems.go.ke","password":"dev-local-only-password"}'
```
**Expected Outcome**: `HTTP/1.1 200 OK` with `Set-Cookie: ems_sid=...; HttpOnly; SameSite=Strict; Path=/; Secure`.

### Test 3: Campaign User Attempting Login on Operations Subdomain
```bash
curl -i -X POST https://ops-konsole.kuratech.site/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: ops-konsole.kuratech.site" \
  -d '{"email":"governor.nairobi@ems.go.ke","password":"dev-local-only-password"}'
```
**Expected Outcome**: `HTTP/1.1 401 Unauthorized` with generic message.
Audit log records: `USER_LOGIN_WRONG_DOMAIN`.

### Test 4: Campaign User Logging in on Main Domain
```bash
curl -i -X POST https://kuratech.site/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: kuratech.site" \
  -d '{"email":"governor.nairobi@ems.go.ke","password":"dev-local-only-password"}'
```
**Expected Outcome**: `HTTP/1.1 200 OK` with session cookie.
