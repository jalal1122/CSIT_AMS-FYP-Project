# Automated GitHub Push-to-Deploy Guide for cPanel

This guide explains how to set up continuous deployment (CI/CD) so that **every time you push commits to GitHub, your code is automatically built and deployed directly to cPanel**.

---

## Recommended Method: GitHub Actions (Automated Build & Deploy)

Using GitHub Actions is the gold standard for deploying React + Node.js MERN apps to cPanel because:
1. **Zero Resource Drain on cPanel**: The React production bundle (`npm run build`) compiles on GitHub's free runners, avoiding memory spikes or CPU throttling on shared cPanel hosting.
2. **Automated File Sync**: Only modified files are uploaded via secure FTP/SFTP.
3. **Automatic Passenger Reload**: The backend can be instructed to hot-reload automatically upon deployment.

A pre-configured GitHub Actions workflow file has been created for you at:
[`.github/workflows/deploy.yml`](file:///j:/Programming/MERN%20Projects/AttendX/AttendX/CSIT_AMS/.github/workflows/deploy.yml).

---

### Step 1: Configure GitHub Repository Secrets

In your GitHub repository:
1. Navigate to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Click **New repository secret** and add the following:

| Secret Name | Description | Example Value |
|---|---|---|
| `CPANEL_FTP_SERVER` | Your cPanel FTP host or server IP | `ftp.csitfmcs.com.pk` or `198.51.100.25` |
| `CPANEL_FTP_USERNAME` | Your cPanel FTP username | `user@csitfmcs.com.pk` or `cpanel_user` |
| `CPANEL_FTP_PASSWORD` | Your cPanel FTP account password | `YourFtpPassword123!` |
| `CPANEL_FRONTEND_DIR` *(optional)* | Remote directory for the frontend files | `/public_html/csitattendance/` |
| `CPANEL_BACKEND_DIR` *(optional)* | Remote directory for the backend API files | `/csitattendanceapi.csitfmcs.com.pk/` |

> [!TIP]
> **Where to find your FTP details in cPanel:**
> In cPanel, go to **FTP Accounts**. You can use your primary cPanel login credentials, or create a dedicated FTP account with its root set to `/home/<username>/`.

---

### Step 2: (Optional) Auto-Restart Backend via SSH

If your cPanel plan has **SSH Access** enabled (Terminal / SSH):
Add these additional optional secrets to GitHub:
- `CPANEL_SSH_HOST`: Your server IP or domain.
- `CPANEL_SSH_USERNAME`: Your cPanel username.
- `CPANEL_SSH_PRIVATE_KEY`: Your private SSH key (generated in cPanel under **SSH Access**).
- `CPANEL_SSH_PORT`: `22` (or your host's custom SSH port).

When configured, the workflow will automatically execute:
```bash
cd csitattendanceapi.csitfmcs.com.pk
npm install --omit=dev
mkdir -p tmp && touch tmp/restart.txt
```
*(Touching `tmp/restart.txt` is Phusion Passenger's universal signal to reload the Node.js process with zero downtime.)*

If SSH is not enabled on your shared hosting plan, you can simply click **Restart Application** once in the cPanel **Setup Node.js App** dashboard after backend code pushes.

---

### Step 3: Trigger Your First Automated Deployment

1. Commit and push any change to your deployment branch:
   ```bash
   git push origin main
   ```
2. Go to your GitHub repository and click on the **Actions** tab.
3. You will see the **Deploy AttendX to cPanel** workflow running:
   - **Job 1**: Checks out code $\rightarrow$ installs dependencies $\rightarrow$ runs `npm run build` $\rightarrow$ deploys `dist/` directly to `csitattendance.csitfmcs.com.pk`.
   - **Job 2**: Prepares backend files $\rightarrow$ deploys backend directly to `csitattendanceapi.csitfmcs.com.pk`.
4. Once completed (typically 45–60 seconds), visit your live domain to see the updates immediately!

---

## Alternative Method: cPanel Git Version Control & Webhooks

If you prefer to pull git commits directly from inside cPanel:

1. In cPanel, open **Git™ Version Control**.
2. Click **Create** and clone your GitHub repository into `/home/<username>/repositories/CSIT_AMS`.
3. A pre-configured [`.cpanel.yml`](file:///j:/Programming/MERN%20Projects/AttendX/AttendX/CSIT_AMS/.cpanel.yml) file is already in the project root:
   ```yaml
   deployment:
     tasks:
       - export DEPLOYPATH=/home/$USER/csitattendanceapi.csitfmcs.com.pk
       - /bin/rsync -av --exclude='.git' --exclude='node_modules' --exclude='src/tests' backend/ $DEPLOYPATH/
       - /bin/mkdir -p $DEPLOYPATH/tmp
       - /bin/touch $DEPLOYPATH/tmp/restart.txt
   ```
4. In the cPanel repository view, copy the **Webhook URL**.
5. In GitHub, go to **Settings** $\rightarrow$ **Webhooks** $\rightarrow$ **Add webhook**:
   - Paste the cPanel webhook URL.
   - Set Content type to: `application/json`.
   - Select: *Just the push event*.
6. Now, every `git push` triggers cPanel to automatically pull the new commits and deploy the backend files.
