# AttendX — CSIT AMS Complete Feature Documentation
> Scanned from every source file in the project.
> Last updated: 2026-08-10

---

## Table of Contents
1. Project Overview
2. Tech Stack and Dependencies
3. Database Models (13 schemas)
4. Backend — Authentication (15 endpoints)
5. Backend — Academic Management (17 endpoints)
6. Backend — Session Management (9 endpoints)
7. Backend — Attendance System (3 endpoints)
8. Backend — Admin Management (11 endpoints)
9. Backend — System Foundation (16 endpoints)
10. Backend — Analytics and Reporting (3 endpoints)
11. Backend — Notifications (5 endpoints)
12. Backend — System Settings (2 endpoints)
13. Backend — Cron Jobs (1 endpoint)
14. Backend Infrastructure (middleware, socket, email, export)
15. Frontend — Routing and Layouts (25 routes)
16. Frontend — Admin Pages (11 pages)
17. Frontend — Teacher Pages (6 pages)
18. Frontend — Student Pages (5 pages)
19. Frontend — Auth Pages (3 pages)
20. Frontend — Shared Components (25+ components)
21. Frontend — State Management — 10 Redux slices
22. Security Architecture
23. Complete API Endpoint Reference

---

## 1. Project Overview

AttendX (CSIT AMS) is a full-stack MERN application for a university Computer Science department.

**3 user roles:** Admin, Teacher, Student

**Core Features:**
- QR-code attendance marking during live class sessions
- Multi-layer anti-fraud: geolocation, IP matching, device fingerprinting (anti-buddy-punching)
- 12+ analytics report types exportable to XLSX/CSV
- Real-time session dashboards via Socket.io
- Automated email alerts for low-attendance defaulters (<75%)

**Project Structure:**
```
CSIT_AMS/
  backend/  (port 5001)
    config/
    src/
      controllers/   10 files
      middlewares/    6 files
      models/        13 Mongoose models
      routes/        10 route files
      services/       6 service files
      utils/          8 utility files
    server.js

  frontend/ (port 5173)
    src/
      pages/         25 page components
      components/    25+ reusable components
      store/slices/  10 Redux slices
      services/      API service layer
```

---

## 2. Tech Stack and Dependencies

### Backend
| Package | Version | Purpose |
|---|---|---|
| express | ^4.18.2 | HTTP server |
| mongoose | ^8.0.0 | MongoDB ODM |
| jsonwebtoken | ^9.0.2 | JWT access + refresh tokens |
| bcryptjs | ^2.4.3 | Password hashing (salt: 10) |
| socket.io | ^4.8.3 | Real-time bidirectional events |
| otplib | ^12.0.1 | TOTP 2FA (Google Authenticator) |
| qrcode | ^1.5.4 | Server-side QR code generation |
| nodemailer | ^7.0.10 | SMTP email delivery |
| multer | ^2.0.2 | File uploads (Excel, avatar) |
| xlsx | ^0.18.5 | Excel parsing |
| exceljs | ^4.4.0 | Styled Excel export |
| node-cron | ^4.4.1 | Scheduled background jobs |
| cloudinary | ^2.8.0 | Avatar cloud storage |
| helmet | ^7.1.0 | HTTP security headers (15) |
| cors | ^2.8.5 | Cross-origin resource sharing |
| compression | ^1.8.1 | gzip response compression |
| moment-timezone | ^0.6.3 | Timezone-aware date operations |
| os-utils | ^0.0.14 | CPU and memory monitoring |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| react | ^19.2.0 | UI framework |
| react-router-dom | ^7.9.6 | Client-side routing |
| @reduxjs/toolkit | ^2.10.1 | State management (RTK) |
| axios | ^1.13.2 | HTTP client |
| socket.io-client | ^4.8.3 | Real-time socket client |
| recharts | ^3.4.1 | Charts and data visualization |
| html5-qrcode | ^2.3.8 | Camera-based QR scanner |
| qrcode.react | ^4.2.0 | QR code display component |
| @dnd-kit/core+sortable | ^6.1.0 | Drag-and-drop curriculum builder |
| tailwindcss | ^3.4.17 | Utility-first CSS |
| lucide-react | ^0.554.0 | Icon library |
| react-select | ^5.10.2 | Multi-select dropdown |
| react-dropzone | ^14.3.5 | Excel file drop zone |
| date-fns | ^4.4.0 | Date manipulation |
| file-saver | ^2.0.5 | Browser file download |
| react-hot-toast | ^2.6.0 | Toast notifications |

---

## 3. Database Models

### 3.1 User Model (user.model.js)
Central identity for all 3 roles.

| Field | Type | Notes |
|---|---|---|
| name | String | indexed |
| email | String | unique, lowercase |
| username | String | unique — Reg No for students, Employee ID for teachers |
| password | String | bcrypt hashed |
| role | Enum | admin / teacher / student |
| accountStatus | Enum | Active / Inactive / Suspended |
| mustChangePassword | Boolean | default true (forces change on first login) |
| info.rollNo | String | student roll number |
| info.section | String | A/B/C... |
| info.semester | Number | 1-8 |
| info.batchId | ObjectId->Batch | |
| info.departmentId | ObjectId->Department | |
| info.disciplineId | ObjectId->Discipline | |
| info.designation | String | teacher |
| info.phone | String | teacher |
| info.fatherName | String | |
| avatar | String | Cloudinary URL |
| refreshToken | String | for rotation strategy |
| isTwoFactorEnabled | Boolean | default false |
| twoFactorSecret | String | TOTP secret (excluded from API responses) |
| mobileNumber | String | future SMS 2FA |
| deviceId | String | hardware fingerprint (anti-buddy-punching) |

**Compound indexes:** [role+accountStatus], [info.batchId+info.section]

**Instance methods:**
- `isPasswordCorrect(pw)` — bcrypt compare
- `generateAccessToken()` — 15-min JWT with role/status/mustChangePassword
- `generateRefreshToken()` — 7-day JWT

---

### 3.2 Attendance Model (attendance.model.js)
One record per student per session.

| Field | Type | Notes |
|---|---|---|
| sessionId | ObjectId->Session | indexed |
| studentId | ObjectId->User | indexed |
| allocationId | ObjectId->CourseAllocation | indexed |
| status | Enum | Present / Absent / Late / Leave / Pending |
| verificationMethod | Enum | QR / Manual |
| deviceId | String | scanning device |
| section | String | section at time of marking |
| isSuspicious | Boolean | flagged by fraud detection |
| metadata.ipAddress | String | student IP |
| metadata.distanceFromTeacher | Number | GPS meters |
| metadata.flagReason | String | comma-separated reasons |
| date | Date | exact scan timestamp |
| weekNumber | Number | auto-calculated ISO week |
| month | Number | 1-12 auto-calculated |
| year | Number | auto-calculated |

**Unique compound index:** sessionId + studentId (prevents double-marking)
**Pre-save hook:** auto-calculates weekNumber, month, year from date

---

### 3.3 Session Model (session.model.js)
One class meeting (live or retroactive).

| Field | Type | Notes |
|---|---|---|
| allocationId | ObjectId->CourseAllocation | |
| sectionName | String | e.g. "A" |
| teacherId | ObjectId->User | |
| startTime | Date | |
| endTime | Date | null while active |
| active | Boolean | true = live |
| isRetroactive | Boolean | past session entered manually |
| qrCodeHash | String | latest QR JWT token |
| teacherIP | String | for IP-matching security |
| type | Enum | Lecture / Lab / Exam |
| location.latitude | Number | |
| location.longitude | Number | |
| securityConfig.radius | Number | 10-500m (default 50) |
| securityConfig.ipMatchEnabled | Boolean | default true |
| securityConfig.deviceLockEnabled | Boolean | default false |
| securityConfig.qrRefreshRate | Number | 5-60s (default 20) |
| securityConfig.manualApproval | Boolean | default false |

---

### 3.4 CourseAllocation Model (courseAllocation.model.js)
Links subject to batch/semester with per-section assignments.

| Field | Type | Notes |
|---|---|---|
| subjectId | ObjectId->Subject | |
| batchId | ObjectId->Batch | |
| semester | Number | |
| isActive | Boolean | false after promotion |
| sections[].name | String | e.g. "A", "B" |
| sections[].teacherId | ObjectId->User | |
| sections[].students | [ObjectId->User] | enrolled students |
| sections[].allowRetroactiveSessions | Boolean | admin-granted, default false |

**Unique index:** subjectId + batchId + semester

---

### 3.5 Batch Model (batch.model.js)
A cohort of students.

Fields: name (unique), disciplineId, departmentId, startingYear,
currentSemester (0=graduated), isActive, previousSemester (rollback),
sections[{name}]

---

### 3.6 Discipline Model (discipline.model.js)
An academic degree program with curriculum map.

Fields: name (unique), code (unique, uppercase), departmentId,
totalSemesters (1-10, default 8),
syllabus[{semester, subjects:[ObjectId->Subject]}]

---

### 3.7 Subject Model (subject.model.js)
An individual course.

Fields: name, code (unique, uppercase), creditHours (1-6),
departmentId, isArchived (soft delete)

---

### 3.8 Department Model (department.model.js)
Fields: name, code (unique, uppercase)

---

### 3.9 Notification Model (notification.model.js)
In-app notifications. **TTL: 30 days** auto-deletion.

Fields: userId, type (info/success/warning/error/session_started/
attendance_updated/system), title, message, link (optional),
isRead (default false), metadata (Mixed)

---

### 3.10 OTP Model (otp.model.js)
Password reset OTPs. **TTL: 10 minutes** auto-expiry.
Fields: email, otp (6-digit string)

---

### 3.11 DeviceResetLog Model (deviceResetLog.model.js)
Audit trail for admin device resets.
Fields: studentId, adminId, previousDeviceId, reason, createdAt

---

### 3.12 SystemSettings Model (systemSettings.model.js)
Key-value runtime config store.
Fields: key (unique), value (Mixed), description

---

### 3.13 SystemTrafficLog Model (systemTrafficLog.model.js)
Aggregated API traffic per endpoint+method+hour.
Fields: endpoint, method, count, timestampHour
**Unique index:** endpoint + method + timestampHour

---

## 4. Backend — Authentication
**Route prefix:** `/api/v2/auth`

**POST /login**
- Accepts identifier (username OR email) + password
- Checks accountStatus before password verification
- Device lock: if user.deviceId set, x-device-id header must match → DEVICE_LOCK_VIOLATION error
- 2FA: if enabled → returns `{require2FA:true, tempToken}` (5-min JWT), no full tokens yet
- Success: accessToken (body) + refreshToken (HTTP-only cookie 7d) + mustChangePassword flag

**POST /register** — Creates any role with role-specific validation. Optional avatar upload.

**POST /setup-profile** — First-login gate (mustChangePassword=true). Min 6 chars, cannot be "password123".

**GET /me** — Full user with populated departmentId + batchId. Excludes password/refreshToken/secret.

**POST /logout** — Clears refreshToken in DB + cookie.

**POST /refresh** — Token rotation. Old refresh token invalidated.

**POST /forgot-password** — 6-digit OTP emailed. Previous OTPs deleted. Valid 10 min.

**POST /reset-password** — Validates email+OTP+newPassword. Clears all refresh tokens system-wide.

**POST /create-admin** — Public bootstrap. Requires adminSecret env var match.

**PATCH /update-password** — Requires currentPassword + newPassword.

**PATCH /update-avatar** — Multipart upload to Cloudinary.

**2FA Endpoints:**
| Endpoint | Description |
|---|---|
| POST /2fa/enable | Generates TOTP secret + QR code data URL. OTP auth URL format: `otpauth://totp/CSIT AMS:<email>?secret=<s>` |
| POST /2fa/verify | Validates TOTP token, activates 2FA |
| POST /2fa/disable | Requires valid current OTP, clears secret |
| POST /2fa/validate | After login with tempToken+OTP → issues full tokens |

---

## 5. Backend — Academic Management
**Route prefix:** `/api/v2/academic`

**POST /batch/create (Admin) — Excel Bulk Enrollment:**
1. Parses Excel file (multer memory storage)
2. Validates columns: Name, Username, Roll No
3. Auto-sections: `Math.ceil(total/maxPerSection)` → A, B, C...
4. Creates Batch document
5. User email: `{username}@csit-ams.edu`, mustChangePassword=true
6. `insertMany({ordered:false})` — partial success
7. Duplicates → HTTP 207 with skipped list

**POST /allocation/assign (Admin)** — Validates subjects in syllabus. Upserts allocations.

**POST /batch/:id/promote (Admin):**
1. Deactivates all current CourseAllocations
2. Increments batch.currentSemester
3. Syncs all student info.semester values

**POST /batch/:id/rollback (Admin):**
1. Deletes current semester's allocations
2. Reactivates previous semester's allocations
3. Decrements batch + student semester values

Other batch endpoints:
- `GET /batches?departmentId=&isActive=` — filterable
- `GET /batch/:id` — full detail with nested syllabus
- `PATCH /batch/:id` — update name or maxStudentsPerSection
- `GET /batch/:id/sections` — sections list
- `GET /allocations?batchId=&semester=&isActive=` — fully populated

**GET /student/dashboard (Student)** — Active subjects with present/total counts (75% threshold applies)

**GET /student/history (Student)** — Past semesters with Cleared/Barred status

**GET /teacher/dashboard (Teacher)** — Active assigned classes with student counts

**GET /teacher/class/:allocationId/:sectionName (Teacher/Admin)** — Roster + last 10 sessions. Auth enforced.

**GET /teacher/class/:allocationId/:sectionName/sessions (Teacher)** — Paginated history (skip+limit)

**GET /teacher/class/:allocationId/:sectionName/student/:sid/report (Teacher)** — Per-student session history

**POST /student/:id/transfer (Admin)** — Validates new section, updates all allocations + student record

---

## 6. Backend — Session Management
**Route prefix:** `/api/v2/session`

**POST /start (Teacher):**
1. Validates allocation active + teacher owns section
2. IDEMPOTENT: returns existing if already active
3. Captures teacher IP (proxy-aware)
4. Clamps: radius 10-500m, qrRefreshRate 5-60s
5. Emits `session:started` Socket.io event
6. Bulk notifications to all section students

**POST /:id/end** — Sets active=false, endTime. Emits `session:ended`.

**PUT /:id/security** — Live-update any security setting. Bounds validated.

**GET /:id/qr** — Signed JWT QR (contains sessionId, allocationId, sectionName, timestamp). Expires in qrRefreshRate seconds. Emits `qr:updated`.

**GET /active** — Teacher's current live session with populated subject + batch.

**GET /active-all (Admin)** — All live sessions with teacher, subject, batch, aggregated stats.

**GET /:id/live** — Per-student live feed: name, rollNo, status, time, isSuspicious, flagReason.

**POST /retroactive** — Past session creation. Requires `allowRetroactiveSessions=true` on section. isRetroactive=true, active=false.

---

## 7. Backend — Attendance System
**Route prefix:** `/api/v2/attendance`

### POST /mark (Student) — 10-Step Anti-Fraud Pipeline

| Step | Check | Action on Failure |
|---|---|---|
| 1 | QR JWT verify (QR_SECRET) | Error with descriptive message |
| 2 | Session active=true | Error |
| 3 | Student in section.students[] | 403 Unauthorized |
| 4 | No duplicate (sessionId+studentId) | 409 Already marked |
| 5 | IP match (if ipMatchEnabled) | Flag isSuspicious, add "IP mismatch" |
| 6 | Geofence (if radius>0, Haversine formula) | Flag "Outside geofence (Xm)" |
| 7 | Device auto-bind (if no deviceId) | Bind now |
| 8A | Device lock: student.deviceId !== incoming | Flag "Device mismatch" |
| 8B | Device lock: device used by another student this session | Flag "Buddy Punching Detected" |
| 9 | manualApproval mode | Status = "Pending" |
| 10 | Success | Emit attendance:updated, return subjectName+sectionName |

### PUT /:id (Teacher) — Manual Override
Allowed statuses: Present, Present (Manual), Absent, Late, Leave, Pending.
Confirms teacher owns session. Clears isSuspicious.

### POST /bulk (Teacher) — Bulk Entry for Retroactive Sessions
bulkWrite with upsert:true. All: verificationMethod="Manual", isSuspicious=false.

---

## 8. Backend — Admin Management
**Route prefix:** `/api/v2/admin`

| Endpoint | Description |
|---|---|
| GET /users | Filterable: role, batchId, section, search (regex), accountStatus, deviceStatus |
| POST /users | Manual creation. Students auto-added to allocations |
| PUT /users/:id | Update name, email, role, info fields |
| PATCH /users/:id/status | Active/Inactive/Suspended. Suspending invalidates tokens |
| PATCH /users/:id/reset-device | Clears deviceId. Creates DeviceResetLog. Sends email alert |
| PATCH /users/:id/reset-password | Default password. Sets mustChangePassword. Invalidates sessions |
| PUT /users/:id/transfer | Cross-batch: changes batchId/disciplineId/section. Updates all allocations |
| POST /teacher/:id/offboard | Sets Inactive. Returns sections needing reassignment |
| PATCH /allocation/:id/reassign-teacher | Updates section teacher. Validates new teacher Active |
| PUT /admin/subject/:id/archive | Toggles isArchived |
| PATCH /allocation/:id/retroactive | Grants/revokes allowRetroactiveSessions per section |

---

## 9. Backend — System Foundation
**Route prefix:** `/api/v2/system`

### Departments (CRUD)
- POST /department — name + uppercase code, duplicate check
- GET /departments — sorted by name
- PUT /department/:id — name/code, uniqueness check
- DELETE /department/:id — orphan check (refuses if disciplines/batches/users linked)

### Subjects (CRUD)
- POST /subject — name, code, creditHours (1-6), departmentId
- GET /subjects?departmentId=&isArchived= — filterable
- GET /subject/:id — populated
- PUT /subject/:id — code uniqueness check
- DELETE /subject/:id — hard delete

### Disciplines (CRUD + Syllabus)
- POST /discipline — name, code, departmentId, totalSemesters (default 8)
- GET /disciplines?departmentId=
- PUT /discipline/:id
- DELETE /discipline/:id
- PUT /discipline/:id/syllabus — **Curriculum Builder**: validates semester bounds, no duplicates, no archived subjects. Replaces full syllabus array.
- GET /discipline/:id/syllabus — populated subject details

### Teachers
- POST /teacher — auto-email `{username}@csit-ams.edu`, mustChangePassword=true, sends welcome email

---

## 10. Backend — Analytics and Reporting
**Route prefix:** `/api/v2/analytics`

### GET /dashboard (Admin)
Parallel Promise.all fetching:
- totalUsers, totalStudents (Active), totalTeachers (Active)
- activeBatches, activeSessions, totalAllocations
- batchStudentCounts (aggregate)
- recentSessions (last 5 with teacher + subject)
- systemHealth: cpuUsage (os-utils), memoryUsage, uptimeSeconds

### POST /generate — 12 Report Types
| Target | Description |
|---|---|
| defaulter-matrix | Students <75% per subject |
| teacher-utilization | Sessions per teacher |
| at-risk-trajectory | Students trending toward default |
| exam-eligibility | Pass/fail by attendance rule |
| inter-discipline-benchmark | Attendance across disciplines |
| medical-leave-ledger | Leave status records |
| repeater-tracking | Repeating students |
| student-onboarding-status | mustChangePassword=true students |
| geofence-drift | GPS-flagged suspicious records |
| device-binding-audit | Buddy-punching, unbound devices |
| system-usage-peaks | Peak API traffic by hour |
| time-of-day-absenteeism | Absenteeism by time of day |
| universal | Full student x subject attendance matrix |

**Dynamic filters:** subjects, batches, departments, disciplines, teachers, sections, students, semester

**Timeframes:** Today, Last 7 Days, Last 30 Days, Full Semester (6mo), Custom Date Range

All normalized to Asia/Karachi (PKT, UTC+5)

### POST /export
Same as /generate but returns binary XLSX (ExcelJS styled) or CSV.
Filename: `AttendX_<target>_<timeframe>.<format>`

---

## 11. Backend — Notifications
**Route prefix:** `/api/v2/notifications`

| Endpoint | Description |
|---|---|
| GET / | Latest 50 notifications + unreadCount |
| PATCH /:id/read | Mark one read |
| PATCH /read-all | Mark all read |
| DELETE /:id | Delete one |
| DELETE /read | Bulk-delete all read |

Notification Service: `sendBulkNotification(userIds[], data)` — DB insert + Socket.io emit to user rooms.
Used by startSession to notify all section students.
Types: info, success, warning, error, session_started, attendance_updated, system
**TTL:** 30 days auto-deletion

---

## 12. Backend — System Settings
**Route prefix:** `/api/v2/settings`

- GET / — Public. Returns all settings as `{key: value}` map
- PUT / — Admin. Upserts any key. Current: `primaryColor`, `secondaryColor` (applied as CSS vars in App.jsx)

---

## 13. Backend — Cron Jobs

**runDefaulterCheck():**
1. All active CourseAllocations
2. Per section: aggregate per-student % (Present/total)
3. Students <75% → email via EmailService.sendDefaulterAlert()
4. Returns {emailsSent, errors}

**HTTP Trigger:** `POST /api/v2/cron/trigger-defaulters`
- Auth: `Authorization: Bearer <CRON_SECRET>`
- Returns 202 immediately, runs in background
- For cPanel: `curl -H "Authorization: Bearer ..." <url>`

**Local (node-cron):**
- `CRON_ALERT_HOUR` (default 17), `CRON_ALERT_DAY` (default 5=Fri), `CRON_TIMEZONE` (default Asia/Karachi)
- Skipped if `NODE_ENV === "production"`

---

## 14. Backend Infrastructure

### Global Middleware Order
1. trafficLogger — upserts SystemTrafficLog (endpoint+method+hour counter)
2. helmet() — 15 security HTTP headers (CSP, HSTS, X-Frame-Options...)
3. cors() — CLIENT_URL only with credentials
4. compression() — gzip
5. express.json({limit:"10mb"})
6. express.urlencoded({extended:true, limit:"10mb"})
7. cookieParser()

### Route-Level Middleware
- **verifyJWT**: decode → accountStatus check (payload) → mustChangePassword gate → DB fetch → re-check accountStatus
- **requireRole(roles[])**: 403 if not in list
- **upload.middleware.js**: Multer memory/disk
- **preventOrphans(field)**: pre-delete reference check (departmentId, disciplineId, subjectId)

### Real-Time (Socket.io)
| Room | Purpose |
|---|---|
| user-{userId} | Private notifications |
| session-{sessionId} | Live session updates |

| Client Event | Action |
|---|---|
| join-user(userId) | Join personal room |
| leave-user(userId) | Leave personal room |
| join-session(sessionId) | Join session room |
| leave-session(sessionId) | Leave session room |

| Server Emit | When | Data |
|---|---|---|
| session:started | Start session | {session} |
| session:ended | End session | {sessionId} |
| qr:updated | New QR | {qrToken, expiresAt} |
| attendance:updated | Student scans | {studentId, status, isSuspicious} |
| [notification] | Session start | bulk to student rooms |

### Email Service (email.service.js)
Class-based, lazy SMTP init. Config: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD.
Templates (Sky Blue #0EA5E9, gradient header #0ea5e9→#0284c7):
- `sendTeacherWelcome(teacher, password)` — on teacher creation
- `sendDefaulterAlert(student, subject, percentage)` — weekly cron
- `sendDeviceAlert(user, type, deviceInfo)` — admin device reset
- Inline OTP email — forgot password

### Export Service (export.service.js)
- `generateDynamicExport(data, format)` — all report types except universal
- `generateUniversalExport(data, format)` — full matrix
- ExcelJS: styled headers, auto column widths
- CSV: plain comma-separated

---

## 15. Frontend — Routing and Layouts

Framework: React Router v7. All pages: React.lazy + Suspense.

**PrivateRoute** — enforces isAuthenticated + allowedRoles[]
**PublicRoute** — redirects to dashboard if authenticated

**Layouts:** AdminLayout, TeacherLayout, StudentLayout

**Dynamic theming:** fetchSettings on load → apply primaryColor/secondaryColor as CSS custom properties.

**Full Route Map:**
```
/                           Landing (public)
/login                      Login (public)
/forgot-password            Forgot password (public)
/admin/bootstrap            Admin bootstrap (public)
/setup-profile              First-login (auth required)

Admin (/admin/*):
  dashboard, foundation, curriculum, faculty, batch, batch/create,
  allocation, promotion, students, live-monitor, reports,
  security-analytics, behavioral-analytics, profile

Teacher (/teacher/*):
  dashboard, session/live/:sessionId,
  class/:allocationId/:sectionName,
  class/:allocationId/:sectionName/history,
  reports, profile

Student (/student/*):
  dashboard, scan, classes/:allocationId, reports, profile

/* → NotFound
```

---

## 16. Frontend — Admin Pages

**AdminDashboard.jsx**
- Stat cards: Total Users, Students, Teachers, Active Batches, Sessions, Allocations
- System health: CPU%, Memory%, Uptime
- Recharts bar chart: student count per batch
- Recent sessions table (last 5)

**Foundation.jsx** (3-tab: Departments | Disciplines | Subjects)
- Full CRUD via modals, orphan check warnings
- Subject archive/unarchive toggle
- Modals: New/Edit Department, New/Edit Discipline, New/Edit Subject

**Curriculum.jsx** (Drag-and-drop)
- @dnd-kit: drag subjects between semesters
- Save → PUT /discipline/:id/syllabus

**Faculty.jsx**
- Teacher table: name, email, dept, status, device status
- Modals: AddTeacherModal, EditUserModal
- Actions: edit, reset pw, reset device, status change, offboard

**BatchCreate.jsx** (Multi-step wizard)
- Step 1: dept + discipline select
- Step 2: react-dropzone Excel upload + column preview
- Step 3: max students per section → section preview → submit
- Shows inserted/duplicate counts

**Allocation.jsx**
- Select batch → all allocations
- Add allocation: subject + teacher per section
- Per-section: toggle retroactive, inline teacher reassign

**Promotion.jsx**
- Active batches list
- Promote / Rollback with confirmation modals

**Students.jsx**
- Filterable table: name/username/rollNo search, batch/section/status/deviceStatus
- Per-student: edit, status, device reset, pw reset, section transfer
- Modals: AddStudentModal, SectionTransferModal, EditUserModal

**AdminReports.jsx**
- Report type selector (12 types)
- UniversalFilterSidebar (all dimensions + timeframe + custom dates)
- Results table (dynamic columns) + ReportGraphicalView (Recharts)
- Export XLSX/CSV

**AdminLiveMonitor.jsx**
- Real-time session cards: teacher, subject, batch, section
- Progress bar (present/total), suspicious badge
- Socket.io auto-updates

**SecurityAnalytics.jsx** — Device binding audit, buddy punching, geofence drift

**BehavioralAnalytics.jsx** — Time-of-day absenteeism, at-risk trajectory

**AdminProfile.jsx** — Edit profile, 2FA, UI color settings

---

## 17. Frontend — Teacher Pages

**TeacherDashboard.jsx**
- Class cards: subject, batch, section, attendance %, student count
- Start Session → StartSessionModal
- History summary link

**LiveSession.jsx** (Real-time control)
- QR: qrcode.react, auto-rotates via qr:updated socket event
- Live attendance feed: updates via attendance:updated socket
- Student list with color-coded status badges
- Suspicious flag list with reasons
- LiveSessionSecurityModal for mid-session security adjustments
- End session (confirmation)
- Manual override: click student → change status

**ClassDetails.jsx**
- Roster with attendance % + progress bars
- Last 10 sessions panel
- Click student → StudentReportModal
- Start new session button

**SessionHistory.jsx** — Paginated: date, type, present/total. "Load More" skip+limit.

**TeacherReports.jsx** — Teacher-scoped reports, chart + table, export.

**TeacherProfile.jsx** — Profile info, avatar, password, 2FA.

---

## 18. Frontend — Student Pages

**StudentDashboard.jsx**
- Subject cards: teacher, progress bar, present/total
- Color: >=75% green, 50-74% yellow, <50% red
- Scan QR shortcut, active session alert banner

**ScanAttendance.jsx**
- html5-qrcode library (camera access)
- POST /attendance/mark with {qrToken, location:{lat,lng}, deviceId}
- deviceId: localStorage fingerprint
- Success/error feedback (subject name + time)

**MyAttendance.jsx** — Session table (date, type, status chips), overall summary.

**StudentReports.jsx** — Full report, Recharts, export.

**StudentProfile.jsx** — Read-only batch/section/semester/rollNo, avatar, password change, 2FA, device status.

---

## 19. Frontend — Auth Pages

**Login.jsx** — identifier OR email, show/hide password, 2FA OTP view switch.

**SetupProfile.jsx** — First-login only. Min 6 chars, not "password123".

**ForgotPassword.jsx** — Step 1: email → OTP. Step 2: OTP + new password. 10-min timer.

---

## 20. Frontend — Shared Components

**AdminLayout.jsx** — Sidebar, bell + unread badge, avatar, logout. Mobile-collapsible.

**NotificationCenter.jsx** — Dropdown (50 notifications), type icons, mark read/delete, real-time via socket user room.

**TwoFactorSettings.jsx** — 3-state: Disabled → QR setup → Enabled.

**ErrorBoundary.jsx** — React class boundary, retry button.

**ConfirmModal.jsx** — Reusable confirmation dialog. isDestructive=red button.

**Toast.jsx / ToastContainer.jsx** — Types: success/error/info/warning. Auto-dismiss + progress bar.

**StatCard.jsx** — icon, label, value, trend indicator.

**Badge.jsx** — Status pill with color variant.

**DataTable.jsx** — Simple table wrapper.

**EmptyState.jsx** — Centered empty state.

### Admin Modals (components/admin/)
| Modal | Purpose |
|---|---|
| AddStudentModal | Manual student creation with batch/section |
| AddTeacherModal | Teacher account creation |
| CreateUserModal | Generic user creation |
| EditUserModal | Edit any user |
| NewDepartmentModal | Create department |
| EditDepartmentModal | Edit department |
| NewDisciplineModal | Create discipline |
| EditDisciplineModal | Edit discipline |
| NewSubjectModal | Create subject |
| EditSubjectModal | Edit subject |
| SectionTransferModal | Move student to different section |
| ReportGraphicalView | Recharts chart for report results |

### Teacher Modals (components/teacher/)
| Modal | Purpose |
|---|---|
| StartSessionModal | Configure session: type, GPS, all security settings |
| LiveSessionSecurityModal | Adjust security mid-session |
| RetroactiveSessionModal | Date + time picker for past session |
| StudentReportModal | Per-student attendance modal from class view |

### Report Components (components/reports/)
| Component | Purpose |
|---|---|
| ReportFilterBar | Quick inline filter bar |
| UniversalFilterSidebar | Full panel: all dimensions, timeframe, custom date range |

---

## 21. Frontend — State Management (Redux)

**Store:** store/index.js — RTK configureStore with 10 slices

| Slice | State | Key Thunks |
|---|---|---|
| authSlice | user, isAuthenticated, isCheckingAuth, isLoading, error | checkAuth, loginUser, logoutUser, setupProfile, enable2FA, verify2FA, disable2FA, validate2FALogin |
| academicSlice | batches, allocations, sections, loading, error | fetchBatches, createBatch, getAllocations, allocateCourse, promoteBatch, rollbackPromotion, transferStudent |
| analyticsSlice | dashboardStats, reportData, exportLoading, loading, error | fetchDashboardStats, generateReport, exportReport |
| sessionSlice | activeSession, sessionHistory, liveAttendance, loading | startSession, endSession, generateQR, getLiveAttendance, updateSessionSecurity, createRetroactiveSession |
| studentSlice | students, loading, error | fetchStudents, resetDevice, resetPassword, updateStatus, transferStudent, createUser |
| facultySlice | faculty, loading, error | fetchFaculty, createTeacher, offboardTeacher, reassignTeacher |
| teacherSlice | dashboard, history, classDetails, studentReport, loading | fetchTeacherDashboard, fetchClassDetails, fetchClassSessions, fetchStudentClassReport |
| notificationSlice | notifications[], unreadCount, loading | fetchNotifications, markAsRead, markAllAsRead, deleteNotification, clearReadNotifications |
| systemSlice | departments, disciplines, subjects, settings, loading, error | CRUD for depts/disciplines/subjects, fetchSettings, updateSettings, archiveSubject, updateSyllabus |
| toastSlice | toasts[] | addToast({type, message}), removeToast(id) |

**Key selectors in authSlice:** selectCurrentUser, selectIsAuthenticated, selectIsCheckingAuth

---

## 22. Security Architecture

### JWT Strategy
| Token | Lifetime | Storage | Payload |
|---|---|---|---|
| Access | 15 min | JS memory | _id, username, email, role, accountStatus, mustChangePassword |
| Refresh | 7 days | HTTP-only cookie + DB | _id only |

- Rotation: every /refresh generates new pair, old invalidated in DB
- Stale protection: verifyJWT re-fetches accountStatus from DB on every request

### mustChangePassword Gate
- Set true on ALL new accounts
- Embedded in access token
- Blocks all routes except /setup-profile and /logout
- Cannot be bypassed even with valid JWT

### Multi-Layer Fraud Detection
| Layer | Mechanism | Per-Session Config |
|---|---|---|
| QR Expiry | JWT signed with QR_SECRET | Yes: 5-60s |
| IP Match | Student IP vs teacher IP | Toggle |
| Geofence | Haversine distance formula | Radius: 10-500m |
| Device Lock | Hardware fingerprint auto-bind | Toggle |
| Buddy Punch | Device already used by other student | Follows device lock |
| Double-Mark | Unique DB index {sessionId,studentId} | Always active |
| Manual Approval | Status=Pending until teacher approves | Toggle |

All flags non-blocking: attendance marked but isSuspicious=true for review.

### Data Integrity
- preventOrphans middleware on all delete routes
- Unique compound indexes prevent allocation + attendance duplicates
- insertMany({ordered:false}) for graceful batch partial failures

### Admin Security
- requireRole(["admin"]) on all admin routes
- Cron endpoint: separate CRON_SECRET bearer token
- Admin bootstrap: ADMIN_SECRET env var

---

## 23. Complete API Endpoint Reference

### Auth — /api/v2/auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /register | Public | Register user |
| POST | /login | Public | Login |
| POST | /logout | JWT | Logout |
| POST | /refresh | Cookie | Refresh tokens |
| GET | /me | JWT | Get current user |
| POST | /setup-profile | JWT | First-login password |
| PATCH | /update-password | JWT | Change password |
| PATCH | /update-avatar | JWT+Multipart | Update avatar |
| POST | /forgot-password | Public | Request OTP |
| POST | /reset-password | Public | Reset with OTP |
| POST | /create-admin | Public+AdminSecret | Bootstrap admin |
| POST | /2fa/enable | JWT | Generate 2FA QR |
| POST | /2fa/verify | JWT | Activate 2FA |
| POST | /2fa/disable | JWT | Deactivate 2FA |
| POST | /2fa/validate | TempToken | Complete 2FA login |

### System — /api/v2/system
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /department | Admin | Create department |
| GET | /departments | Admin | List departments |
| PUT | /department/:id | Admin | Update department |
| DELETE | /department/:id | Admin | Delete (orphan check) |
| POST | /subject | Admin | Create subject |
| GET | /subjects | Admin | List subjects |
| GET | /subject/:id | Admin | Get subject |
| PUT | /subject/:id | Admin | Update subject |
| DELETE | /subject/:id | Admin | Delete subject |
| POST | /discipline | Admin | Create discipline |
| GET | /disciplines | Admin | List disciplines |
| PUT | /discipline/:id | Admin | Update discipline |
| DELETE | /discipline/:id | Admin | Delete discipline |
| PUT | /discipline/:id/syllabus | Admin | Update curriculum |
| GET | /discipline/:id/syllabus | Admin | Get syllabus |
| POST | /teacher | Admin | Create teacher |

### Academic — /api/v2/academic
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /batch/create | Admin | Bulk create via Excel |
| GET | /batches | Admin | List batches |
| GET | /batch/:id | Admin | Batch details |
| PATCH | /batch/:id | Admin | Update batch |
| GET | /batch/:id/sections | Admin | Get sections |
| POST | /allocation/assign | Admin | Assign subject+teachers |
| GET | /allocations | Admin | List allocations |
| POST | /batch/:id/promote | Admin | Promote semester |
| POST | /batch/:id/rollback | Admin | Rollback semester |
| POST | /student/:id/transfer | Admin | Section transfer |
| GET | /student/dashboard | Student | Dashboard data |
| GET | /student/history | Student | Past semesters |
| GET | /teacher/dashboard | Teacher | Teacher classes |
| GET | /teacher/history | Teacher | Past sessions |
| GET | /teacher/class/:id/:section | Teacher | Class roster |
| GET | /teacher/class/:id/:section/sessions | Teacher | Session history |
| GET | /teacher/class/:id/:section/student/:sid/report | Teacher | Student report |

### Admin — /api/v2/admin
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /users | Admin | List users |
| POST | /users | Admin | Create user |
| PUT | /users/:id | Admin | Update user |
| PATCH | /users/:id/status | Admin | Change status |
| PATCH | /users/:id/reset-device | Admin | Clear device |
| PATCH | /users/:id/reset-password | Admin | Default password |
| PUT | /users/:id/transfer | Admin | Cross-batch transfer |
| POST | /teacher/:id/offboard | Admin | Deactivate teacher |
| PATCH | /allocation/:id/reassign-teacher | Admin | Reassign teacher |
| PUT | /admin/subject/:id/archive | Admin | Archive/unarchive |
| PATCH | /allocation/:id/retroactive | Admin | Toggle retroactive |

### Session — /api/v2/session
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /start | Teacher | Start session |
| POST | /:id/end | Teacher | End session |
| PUT | /:id/security | Teacher | Update security |
| GET | /:id/qr | Teacher | Generate QR |
| GET | /active | Teacher | My active session |
| GET | /:id | Teacher/Admin | Session by ID |
| GET | /active-all | Admin | All active sessions |
| GET | /:id/live | Teacher | Live attendance feed |
| POST | /retroactive | Teacher | Past session |

### Attendance — /api/v2/attendance
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /mark | Student | QR scan (full anti-fraud) |
| PUT | /:id | Teacher | Manual override |
| POST | /bulk | Teacher | Bulk insert |

### Analytics — /api/v2/analytics
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /dashboard | Admin | Dashboard + health stats |
| POST | /generate | JWT | Generate report (12 types) |
| POST | /export | JWT | Export XLSX/CSV |

### Notifications — /api/v2/notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | JWT | Get notifications |
| PATCH | /:id/read | JWT | Mark as read |
| PATCH | /read-all | JWT | Mark all read |
| DELETE | /:id | JWT | Delete one |
| DELETE | /read | JWT | Clear all read |

### Settings — /api/v2/settings
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Public | Get all settings |
| PUT | / | Admin | Update settings |

### Cron — /api/v2/cron
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /trigger-defaulters | CronSecret | Run defaulter check |

---

## Key Constants and Notes

| Constant | Value |
|---|---|
| Attendance threshold | 75% (hardcoded across all relevant features) |
| Default timezone | Asia/Karachi (PKT, UTC+5) |
| QR refresh range | 5-60 seconds |
| Geofence radius range | 10-500 meters |
| Notification TTL | 30 days |
| OTP TTL | 10 minutes |
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 7 days |
| Default student password | DEFAULT_STUDENT_PASSWORD env or "password123" |
| Default teacher password | DEFAULT_TEACHER_PASSWORD env or "password123" |
| Auto-generated email | {username}@csit-ams.edu |
| Body size limit | 10MB |

### Key Environment Variables
```
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY ("15m"), JWT_REFRESH_EXPIRY ("7d")
QR_SECRET            Separate key for QR JWT signing
ADMIN_SECRET         Admin bootstrap endpoint key
CRON_SECRET          Cron trigger endpoint key
DEFAULT_STUDENT_PASSWORD, DEFAULT_TEACHER_PASSWORD
EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
CLIENT_URL           CORS allowed origin (frontend URL)
PORT                 Server port (default 5001)
COOKIE_SECURE, COOKIE_SAME_SITE
CRON_ALERT_HOUR (default 17), CRON_ALERT_DAY (default 5=Fri), CRON_TIMEZONE
BODY_SIZE_LIMIT      Max request body (default "10mb")
NODE_ENV             "production" disables node-cron, enables cPanel mode
```
