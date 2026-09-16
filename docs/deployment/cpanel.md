# AttendX (CSIT AMS) Production Deployment Guide for cPanel

This guide provides step-by-step instructions for deploying AttendX on a cPanel hosting environment using **Phusion Passenger (Setup Node.js App)** for the backend and Apache static hosting for the React frontend across designated subdomains.

---

## Architecture Overview

| Service | Production Subdomain | cPanel Implementation |
|---|---|---|
| **Frontend UI** | `https://csitattendance.csitfmcs.com.pk` | Static files from `frontend/dist/` with Apache `.htaccess` SPA rewrites |
| **Backend API** | `https://csitattendanceapi.csitfmcs.com.pk` | Node.js 18+/20+ running via cPanel "Setup Node.js App" (Passenger) |
| **Database** | MongoDB Atlas Cluster | Managed cloud database (`MONGODB_URI`) |
| **Cron Scheduler** | Weekly Defaulter Alerts | cPanel Linux OS Cron invoking API webhook with `x-cron-secret` |

---

## Step 1: Subdomain & SSL Setup in cPanel

1. Log into your cPanel account.
2. Navigate to **Domains** (or **Subdomains**):
   - Create subdomain: `csitattendance` for domain `csitfmcs.com.pk`  
     *Document Root*: `/home/<username>/public_html/csitattendance` (or `/csitattendance.csitfmcs.com.pk`)
   - Create subdomain: `csitattendanceapi` for domain `csitfmcs.com.pk`  
     *Document Root*: `/home/<username>/csitattendanceapi.csitfmcs.com.pk`
3. Navigate to **SSL/TLS Status**:
   - Run **AutoSSL** (or install Let's Encrypt certificates) for both subdomains.
   - Verify both URLs resolve over `https://` with valid green padlocks.

---

## Step 2: Backend Deployment (cPanel Node.js App)

### 1. Prepare Backend Files for Upload
On your local machine, prepare an archive containing the backend files.

**Include:**
- `app.js` (cPanel Passenger entrypoint)
- `server.js`
- `package.json` & `package-lock.json`
- `src/` (controllers, models, routes, middlewares, services, utils)
- `config/` (db connection)
- `.env` (configured for production)

**Exclude (Do NOT upload):**
- `node_modules/` (will be installed directly on the server)
- `src/tests/` (unit tests not needed on production)
- `.git/`

### 2. Configure Node.js App in cPanel
1. In cPanel, open **Setup Node.js App** (under the *Software* category).
2. Click **Create Application**.
3. Fill in the application fields:
   - **Node.js Version**: Select `18.x`, `20.x`, or `22.x`.
   - **Application Mode**: `Production`.
   - **Application Root**: `csitattendanceapi.csitfmcs.com.pk` (or directory path where backend files are placed).
   - **Application URL**: `csitattendanceapi.csitfmcs.com.pk`.
   - **Application Startup File**: `app.js` (or `server.js`).
   - **Passenger Log File**: `passenger.log` (recommended for troubleshooting).
4. Click **Create**.

### 3. Upload Files & Configure Environment Variables
1. Using cPanel **File Manager** or **FTP**, upload your backend files into the application root directory.
2. Create a `.env` file in the application root (you can base it on `backend/.env.production.example`):
   ```ini
   NODE_ENV=production
   PORT=5001
   BODY_SIZE_LIMIT=10mb
   TIMEZONE=Asia/Karachi
   APP_NAME="CSIT AMS"
   INSTITUTION_EMAIL_DOMAIN=csit-ams.edu

   # Database Connection
   MONGODB_URI=mongodb+srv://mjdev:7ugvf0lYyTDo0980@cluster0.m2ocs8a.mongodb.net/CSITAMS?retryWrites=true&w=majority&appName=Cluster0

   # JWT & Security Secrets
   JWT_ACCESS_SECRET=526a843b1861fc32c40268af25fd6ec88172623beaea82f9701afe78a814e064
   JWT_REFRESH_SECRET=2f8ce41f692aa0e3468dc0c7eb8f09de102de2be8c27f30d5602613b71ce9815
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   QR_SECRET=e40cfe2dd5de8a8ade4013a8036e2d9b29db4bb6f9e1e81eea20876d133b2df0

   ADMIN_SECRET=jam-2025
   DEFAULT_STUDENT_PASSWORD=password123
   DEFAULT_TEACHER_PASSWORD=password123

   # Critical Cross-Subdomain Cookie Configuration
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=none
   CLIENT_URL=https://csitattendance.csitfmcs.com.pk

   # Cloudinary Storage
   CLOUDINARY_CLOUD_NAME=dd2qqutlq
   CLOUDINARY_API_KEY=849325417617367
   CLOUDINARY_API_SECRET=8cRRnYjiJykw0gfHb9AYA_Aux2Y

   # Email Dispatcher
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=jk4350649@gmail.com
   SMTP_PASS=unogqjhsmlfrlaql
   EMAIL_FROM="CSIT AMS <noreply@csit-ams.edu>"

   # Cron Security
   CRON_SECRET=attendx_production_cron_secret_key_2026
   CRON_ALERT_HOUR=17
   CRON_ALERT_DAY=5
   CRON_TIMEZONE=Asia/Karachi
   ```

### 4. Install Dependencies & Start Application
1. Return to the cPanel **Setup Node.js App** dashboard.
2. Click **Run NPM Install** (or copy the virtual environment command at the top of the page, paste it into cPanel **Terminal**, and run `npm install --omit=dev`).
3. Click **Restart Application**.
4. Test the health endpoint in your browser:  
   `https://csitattendanceapi.csitfmcs.com.pk/api/v2/health`  
   Expected response:
   ```json
   { "status": "ok", "message": "CSIT AMS v2 API is running" }
   ```

---

## Step 3: Frontend Deployment

### 1. Build Frontend Production Bundle
On your local machine, compile the production distribution with the production API URL:
```bash
cd frontend
npm run build
```
This generates the optimized bundle in `frontend/dist/`.

### 2. Verify `.htaccess` in `dist`
Verify that `frontend/dist/.htaccess` is present:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```
> [!IMPORTANT]
> This `.htaccess` file is mandatory for single-page applications. Without it, refreshing pages like `/admin/batches` or `/login` will result in an Apache 404 Not Found error.

### 3. Upload to cPanel
1. Compress all files and folders inside `frontend/dist/` into a `.zip` file.
2. Open cPanel **File Manager** and navigate to the document root for `csitattendance.csitfmcs.com.pk`.
3. Upload and extract the zip file.
4. Ensure `index.html`, `.htaccess`, and the `assets/` folder are located directly in the root of the subdomain folder.
5. Visit `https://csitattendance.csitfmcs.com.pk` in your browser.

---

## Step 4: Configure cPanel Cron Job for Defaulters

In production (`NODE_ENV=production`), the backend skips internal `node-cron` timers to prevent duplicate execution across Passenger worker threads. Instead, cPanel Linux cron triggers the webhook.

1. In cPanel, navigate to **Cron Jobs** (under *Advanced*).
2. Set Common Settings to: **Once a week** (or customized):
   - Minute: `0`
   - Hour: `17` (5:00 PM)
   - Day: `*`
   - Month: `*`
   - Weekday: `5` (Friday)
3. In the **Command** box, enter:
   ```bash
   curl -s -X POST https://csitattendanceapi.csitfmcs.com.pk/api/v2/cron/trigger-defaulters -H "x-cron-secret: attendx_production_cron_secret_key_2026" >/dev/null 2>&1
   ```
4. Click **Add New Cron Job**.

---

## Step 5: Post-Deployment Smoke Test Checklist

| Verification Check | Target URL / Flow | Expected Result |
|---|---|---|
| **API Health** | `https://csitattendanceapi.csitfmcs.com.pk/api/v2/health` | HTTP 200 `{ status: "ok" }` |
| **Frontend Routing** | Direct browser access to `https://csitattendance.csitfmcs.com.pk/login` | Renders styled Login card without 404 |
| **Admin Authentication** | Log in with `admin` / `AdminPassword123!` | Successfully authenticates, stores refresh token cookie, redirects to `/admin/dashboard` |
| **Cross-Subdomain Cookies** | Inspect Application Cookies in DevTools | `refreshToken` cookie stored with `SameSite=None; Secure=true` |
| **Teacher Live Session** | Log in as teacher, start session | Generates rotating QR token every 20s |
| **Student Scanning** | Log in as student on mobile, scan QR | Successfully records attendance and increments live teacher feed |
| **Excel Export** | Export class attendance from Teacher or Admin | Downloads styled `.xlsx` file cleanly |

---

## Troubleshooting & FAQs

### 1. 503 Service Unavailable or "Node.js Application failed to start"
- Check the error log in the application root (e.g. `stderr.log` or `passenger.log`).
- Common cause: Incorrect Node.js version selected (ensure Node 18 or 20).
- Common cause: Missing MongoDB connection string in `.env`. Verify MongoDB Atlas Network Access permits connection from your cPanel server IP (or whitelist `0.0.0.0/0`).

### 2. Login succeeds but immediately redirects back to Login (Cookie Loss)
- Ensure `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none` in the backend `.env`.
- Browsers block third-party/cross-subdomain cookies unless both `SameSite=None` and `Secure=true` are active on HTTPS.

### 3. 404 on page refresh on frontend
- Ensure `.htaccess` exists in the frontend root.
- Ensure cPanel allows `.htaccess` overrides (standard on all cPanel hosts).

### 4. WebSocket Disconnects
- In shared hosting environments where Apache does not proxy raw WebSocket upgrades, AttendX's Socket.io client and server are pre-configured to fall back automatically to HTTP long-polling (`transports: ['websocket', 'polling']`), maintaining real-time functionality without disruption.
