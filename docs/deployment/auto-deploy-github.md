# Automated GitHub Push-to-Deploy Guide for cPanel

This guide provides step-by-step instructions on setting up **Continuous Deployment (CI/CD)** with GitHub Actions.

Every time you push code to the **`main`** branch, GitHub Actions will automatically:
1. Compile the React frontend for production (`npm run build`) and deploy it to `https://csitattendance.csitfmcs.com.pk`.
2. Package the Node.js backend and deploy it to `https://csitattendanceapi.csitfmcs.com.pk`.
3. Signal cPanel's Phusion Passenger to reload the Node.js app without downtime.

> [!NOTE]
> **Branch Rule**: Pushes to `main` trigger the automated deployment. Pushes to `dev`, feature branches, or pull requests will **NOT** trigger a deployment.

---

## Architecture Overview

```mermaid
flowchart LR
    Dev[Developer] -->|git push origin main| GH[GitHub Repository]
    Dev -->|git push origin dev| DevBranch[dev branch - No Deploy]
    
    subgraph GitHub Actions Runner
        GH --> Runner[Ubuntu Runner]
        Runner --> Job1[Job 1: Build & Deploy Frontend]
        Runner --> Job2[Job 2: Package & Deploy Backend]
    end
    
    subgraph cPanel Server
        Job1 -->|FTP/SFTP| FrontendDir[csitattendance.csitfmcs.com.pk]
        Job2 -->|FTP/SFTP| BackendDir[csitattendanceapi.csitfmcs.com.pk]
        Job2 -->|touch tmp/restart.txt| Passenger[Phusion Passenger Reload]
    end
```

The pre-configured workflow file is located at [`.github/workflows/deploy.yml`](file:///j:/Programming/MERN%20Projects/AttendX/AttendX/CSIT_AMS/.github/workflows/deploy.yml).

---

## Step 1: Locate Your Credentials in cPanel

Before adding secrets to GitHub, collect the following values from your cPanel dashboard.

### 1. `CPANEL_FTP_SERVER` (Server Hostname or IP)
- In cPanel, look at the right sidebar under **General Information**.
- Locate **Shared IP Address** (e.g. `198.51.100.25`) or **Server Name**.
- Alternatively, you can usually use `ftp.csitfmcs.com.pk` or your main domain name.
- **Value to use**: Either your Shared IP address (e.g. `198.51.100.25`) or `ftp.csitfmcs.com.pk`.

---

### 2. `CPANEL_FTP_USERNAME` and `CPANEL_FTP_PASSWORD`
You have two options for FTP credentials:

#### Option A: Use Your Primary cPanel Login (Simplest)
- Your primary cPanel username and password have full root access to your entire hosting account (`/home/<username>/`).
- **Username**: Your cPanel username (shown on the cPanel right sidebar under *Current User*).
- **Password**: Your cPanel login password.

#### Option B: Create a Dedicated FTP Account (Recommended for Security)
1. In cPanel, navigate to **Files** $\rightarrow$ **FTP Accounts**.
2. Under **Add FTP Account**:
   - **Log in**: Choose a username, e.g. `deployer` (full username will be `deployer@csitfmcs.com.pk`).
   - **Password**: Generate a secure password and save it.
   - **Directory**: **IMPORTANT** — Clear out the default path and set it to your home directory root:
     ```
     /home/YOUR_CPANEL_USERNAME/
     ```
     *(or simply leave it blank if cPanel prefixes `/home/username/` so the account has access to both your frontend and backend directories).*
3. Click **Create FTP Account**.

---

### 3. `CPANEL_FRONTEND_DIR` (Frontend Subdomain Directory)
1. In cPanel, go to **Domains** (or **Subdomains**).
2. Look at the row for `csitattendance.csitfmcs.com.pk`.
3. Check the **Document Root** column:
   - If the Document Root is `public_html/csitattendance`, your FTP path is:
     ```
     /public_html/csitattendance/
     ```
   - If the Document Root is `csitattendance.csitfmcs.com.pk` (outside public_html), your FTP path is:
     ```
     /csitattendance.csitfmcs.com.pk/
     ```
4. **Value to use**: The Document Root path with leading and trailing slashes (e.g. `/public_html/csitattendance/`).

---

### 4. `CPANEL_BACKEND_DIR` (Backend Subdomain Directory)
1. In cPanel, navigate to **Software** $\rightarrow$ **Setup Node.js App**.
2. Click on your application (`csitattendanceapi.csitfmcs.com.pk`).
3. Look at the **Application root** field.
   - Typically this is `csitattendanceapi.csitfmcs.com.pk` or `api`.
4. **Value to use**: The application root folder with leading and trailing slashes (e.g. `/csitattendanceapi.csitfmcs.com.pk/`).

---

### 5. SSH Credentials (Optional — For Advanced Auto-Restart)

> [!TIP]
> **SSH is completely optional!** Our workflow automatically creates `tmp/restart.txt` in the backend upload bundle. Phusion Passenger detects the timestamp change and reloads the Node.js application automatically upon file transfer.
>
> If your hosting provider allows SSH and you want GitHub Actions to run `npm install --omit=dev` directly on the server, configure these optional secrets:

1. In cPanel, check if **Terminal** or **SSH Access** is available under the *Security* or *Advanced* section.
2. In **SSH Access** $\rightarrow$ **Manage SSH Keys** $\rightarrow$ **Generate a New Key**:
   - Key Name: `id_rsa_github`
   - Key Password: Leave blank or set a passphrase.
   - Key Type: `RSA`, Key Size: `2048` (or `4096`).
   - Click **Generate Key**.
3. Under **Public Keys**, find the newly created key and click **Manage** $\rightarrow$ **Authorize**.
4. Under **Private Keys**, click **View/Download** on the key and copy the entire text (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`).
5. **Values to use**:
   - `CPANEL_SSH_HOST`: Your server IP or domain.
   - `CPANEL_SSH_USERNAME`: Your primary cPanel username.
   - `CPANEL_SSH_PRIVATE_KEY`: The copied private key text.
   - `CPANEL_SSH_PASSPHRASE`: The passphrase (leave empty if none was set).
   - `CPANEL_SSH_PORT`: `22` (or your host's custom port if specified).

---

## Step 2: Add Secrets to Your GitHub Repository

1. Open your repository on GitHub (`https://github.com/your-username/CSIT_AMS`).
2. Click **Settings** (tab at the top).
3. In the left sidebar, click **Secrets and variables** $\rightarrow$ **Actions**.
4. Click the green **New repository secret** button.
5. Add the secrets one by one:

| Secret Name | Value | Required? |
|---|---|:---:|
| `CPANEL_FTP_SERVER` | Your Shared IP address or `ftp.csitfmcs.com.pk` | **Yes** |
| `CPANEL_FTP_USERNAME` | Your cPanel or FTP username | **Yes** |
| `CPANEL_FTP_PASSWORD` | Your cPanel or FTP password | **Yes** |
| `CPANEL_FRONTEND_DIR` | e.g. `/public_html/csitattendance/` | Recommended |
| `CPANEL_BACKEND_DIR` | e.g. `/csitattendanceapi.csitfmcs.com.pk/` | Recommended |
| `CPANEL_SSH_HOST` | Server IP or hostname | *Optional* |
| `CPANEL_SSH_USERNAME` | cPanel username | *Optional* |
| `CPANEL_SSH_PRIVATE_KEY` | Private SSH key string | *Optional* |

---

## Step 3: Triggering Deployments

### How It Works in Practice

#### 1. Working on Development (`dev` branch)
When working on new features or testing changes locally:
```bash
git checkout dev
# make edits...
git add .
git commit -m "feat: test new feature"
git push origin dev
```
> 🛡️ **Result**: GitHub receives your code on the `dev` branch. **No deployment action runs.** Your live cPanel site remains completely untouched.

#### 2. Deploying to Production (`main` branch)
When changes are tested and ready for live deployment, merge or push to `main`:
```bash
git checkout main
git merge dev
git push origin main
```
> 🚀 **Result**: GitHub Actions automatically triggers:
> 1. Installs frontend dependencies and compiles `frontend/dist/`.
> 2. Uploads the updated frontend assets directly to `https://csitattendance.csitfmcs.com.pk`.
> 3. Uploads the updated backend code directly to `https://csitattendanceapi.csitfmcs.com.pk`.
> 4. Reloads the Phusion Passenger Node.js app.
> 5. Both services go live in ~60 seconds.

---

## Step 4: Monitoring Deployments in GitHub

1. In your GitHub repository, click on the **Actions** tab.
2. You will see a list of workflow runs. Click on the latest run titled **Deploy CSIT_AMS to cPanel**.
3. You can click into either:
   - **Build & Deploy Frontend**
   - **Deploy Backend API & Reload Passenger**
4. Watch live streaming terminal logs for each step. If an FTP upload or build fails, the error message will be highlighted directly in the log.

---

## Troubleshooting Common CI/CD Gotchas

### 1. `Error: 530 Login authentication failed`
- **Cause**: Incorrect FTP username or password in GitHub Secrets.
- **Fix**: Double check `CPANEL_FTP_USERNAME` and `CPANEL_FTP_PASSWORD`. Test logging into your FTP using an FTP client like FileZilla with those exact credentials.

### 2. `Error: 550 Can't change directory to /public_html/...: No such file or directory`
- **Cause**: The path specified in `CPANEL_FRONTEND_DIR` or `CPANEL_BACKEND_DIR` does not match the server directory tree.
- **Fix**: Open cPanel **File Manager**. Trace the path from your account root:
  - If your domain folder is directly under home, use `/csitattendance.csitfmcs.com.pk/`.
  - If it is inside public_html, use `/public_html/csitattendance/`.

### 3. Backend files updated but live site still runs old code
- **Cause**: Phusion Passenger has not reloaded the process into memory.
- **Fix**: The workflow creates `tmp/restart.txt`. Ensure the `tmp/` folder inside your backend application root is writable. Alternatively, navigate to **cPanel > Setup Node.js App** and click **Restart Application**.
