# Live Production Verification & Account Seeding Walkthrough

### Status: Verified Live & Operational (HTTP 200 OK)

All fixes have been deployed and verified directly on the live VPS production server (`https://kuratech.site`).

---

## 1. Summary of Changes Implemented

1. **Non-Destructive Baseline User Merging (`server/users.store.js`)**:
   - `ensureBaselineUsers()` checks existing accounts in the server store (`.data/users.json` and cross-location `/var/lib/ems/users.json`).
   - Any accounts created on the VPS are **100% preserved and untouched**.
   - Missing baseline personas (`admin.super@ems.go.ke`, `governor.nairobi@ems.go.ke`, etc.) are hashed with scrypt and appended.
   - Automatic `.bak` backup file generated on each save.
   - Automatically executed on backend startup and on demand if user list is empty.

2. **Unified Admin Login & Direct Redirection (`server.mjs`, `LoginModal.jsx`)**:
   - Super Admin and Admin accounts are now permitted to sign in directly from the main domain (`https://kuratech.site/`) as well as `admin.html`.
   - On successful sign in, the server sets both `ems_admin_sid` and `ems_sid` cookies and returns `redirectTo: '/admin.html'`.
   - The frontend `LoginModal` detects `redirectTo` and transitions the admin straight into the **Operations Console** at `https://kuratech.site/admin.html`.
   - Non-admin roles (e.g. Agents, Coordinators) remain strictly barred from `admin.html` and administrative endpoints (`/api/admin/*`).

3. **Multi-Location User Safety**:
   - Enhanced `loadUsers()` to safely read and merge accounts from `/var/lib/ems/users.json` if existing on Linux, ensuring no account created outside the working directory is lost.
   - Preserved git ignore rules ensuring `.data/` is never overwritten by Git or SCP deployments.

---

## 2. Live Verification Results

### A. Super Admin Authentication (`admin.super@ems.go.ke`)
```bash
curl.exe -i -s -X POST https://kuratech.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin.super@ems.go.ke","password":"AdminSuper2026!"}'
```
**Response (HTTP 200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "realm": "admin",
  "redirectTo": "/admin.html",
  "user": {
    "id": "USR-ADMIN-01",
    "name": "Admin System Director",
    "role": "Super Admin",
    "email": "admin.super@ems.go.ke",
    "phone": "+254 700 000 000",
    "assignedEntity": "GLOBAL",
    "entityName": "National HQ"
  }
}
```
*Cookies Issued:*
- `Set-Cookie: ems_admin_sid=...; HttpOnly; Path=/; SameSite=Strict; Max-Age=28800; Secure`
- `Set-Cookie: ems_sid=...; HttpOnly; Path=/; SameSite=Strict; Max-Age=28800; Secure`

---

### B. Baseline Role Authentication (`governor.nairobi@ems.go.ke`)
```bash
curl.exe -i -s -X POST https://kuratech.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"governor.nairobi@ems.go.ke","password":"AdminSuper2026!"}'
```
**Response (HTTP 200 OK)**:
```json
{
  "success": true,
  "token": "...",
  "realm": "user",
  "redirectTo": null,
  "user": {
    "id": "USR-GOVERNOR-01",
    "name": "Hon. Johnson Sakaja (Governor Nairobi)",
    "role": "Governor",
    "email": "governor.nairobi@ems.go.ke"
  }
}
```

---

### C. Live Admin Endpoint Access (`/api/admin/users`)
- Verified `GET https://kuratech.site/api/admin/users` using the issued Admin token:
- Successfully retrieved all active user accounts from the live database.

---

---

## 4. Google Maps Live Activation & Dynamic Key Delivery

### Verified Live Endpoints:
- `GET https://kuratech.site/api/config/maps`: **HTTP 200 OK** (Dynamically delivers runtime Google Maps key to frontend).
- `POST https://kuratech.site/api/config/maps`: **HTTP 200 OK** (Allows authenticated Super Admin to persist Google Maps key globally across the server).
- `deploy.yml`: Updated with `VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}` for CI/CD bundling.

### How to Activate Your Key on Live:

You have **3 simple options** to make Google Maps visible to everyone:

#### Option 1: Right in the Browser (Fastest, zero terminal needed)
1. Go to **`https://kuratech.site/`** and sign in as Super Admin (`admin.super@ems.go.ke` / `AdminSuper2026!`).
2. Open the **Electoral Map Room** (`#map-room` or via navigation).
3. Paste your Google Maps API key (`AIzaSy...`) into the input box and click **Save & Activate**.
4. The key will be saved directly to the live server database (`ems_server_db.json`), immediately activating Google Satellite and Street maps for **all** visitors!

#### Option 2: Add as GitHub Secret (Permanent CI/CD Embedding)
1. In your GitHub repository: Go to **Settings > Secrets and variables > Actions**.
2. Click **New repository secret**.
3. Name: `VITE_GOOGLE_MAPS_API_KEY`
4. Value: `Your_AIzaSy_Key_Here`
5. On the next push/deploy, Vite will compile this key directly into the production bundle.

#### Option 3: VPS Environment File
1. On your VPS, edit `/var/www/kutatech-api/.env` (or create it):
   ```bash
   GOOGLE_MAPS_API_KEY="Your_AIzaSy_Key_Here"
   ```
2. Restart backend:
   ```bash
   bash /var/www/kutatech-api/deploy/restart-backend.sh
   ```

