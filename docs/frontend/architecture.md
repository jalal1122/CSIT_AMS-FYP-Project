# Frontend Architecture Documentation

This document describes the high-level architecture of the AttendX React 19 single-page application, covering State Management (Redux Toolkit), WebSocket listeners, Role-Based Route Guards, and Component Hierarchies.

---

## 1. Application Layout Hierarchy

The application employs three distinct role-based layouts that wrap page routes:

```
App.jsx
  ├── AuthProvider (Restores session & checks /me)
  ├── SocketProvider (Establishes authenticated Socket.io connection)
  └── Router
       ├── Public Routes (Unauthenticated)
       │    ├── / (LandingPage)
       │    ├── /login (Login)
       │    ├── /setup-profile (SetupProfile)
       │    └── /forgot-password (ForgotPassword)
       │
       ├── Protected Admin Routes (Wrapped in AdminLayout)
       │    ├── /admin/dashboard
       │    ├── /admin/batches & /admin/batches/create
       │    ├── /admin/foundation
       │    ├── /admin/faculty
       │    ├── /admin/students
       │    ├── /admin/curriculum
       │    ├── /admin/promotion
       │    ├── /admin/allocation
       │    ├── /admin/reports
       │    └── /admin/profile
       │
       ├── Protected Teacher Routes (Wrapped in TeacherLayout)
       │    ├── /teacher/dashboard
       │    ├── /teacher/live-session
       │    ├── /teacher/courses/:id
       │    ├── /teacher/history
       │    ├── /teacher/reports
       │    └── /teacher/profile
       │
       └── Protected Student Routes (Wrapped in StudentLayout)
            ├── /student/dashboard
            ├── /student/scan
            ├── /student/attendance
            ├── /student/reports
            └── /student/profile
```

---

## 2. State Management Tree (Redux Toolkit)

The global store (`frontend/src/store/index.js`) coordinates 10 specialized domain slices:

| Slice | File | Responsibility |
|---|---|---|
| `auth` | `authSlice.js` | User credentials, JWT access token, roles, 2FA status, and password setup flags |
| `academic` | `academicSlice.js` | Batches, manual sections, per-batch subjects, promotions, and allocations |
| `session` | `sessionSlice.js` | Active teacher session state, rotating QR token, and live student attendance feed |
| `attendance` | `attendanceSlice.js` | Student scan submission, personal logs, and manual teacher edits |
| `admin` | `adminSlice.js` | User directory, device resets, password overrides, and teacher offboarding |
| `analytics` | `analyticsSlice.js` | Universal filter criteria, aggregated reports, and dashboard trends |
| `system` | `systemSlice.js` | Departments, disciplines, master syllabi, and subjects |
| `systemSettings`| `systemSettingsSlice.js` | Global thresholds, radius bounds, and institute branding |
| `notification` | `notificationSlice.js` | In-app alerts, unread counts, and real-time socket notification dispatch |
| `ui` | `uiSlice.js` | Theme toggling, mobile sidebar visibility, and modal states |

---

## 3. Real-Time WebSocket Architecture

The frontend connects to Socket.io via an ambient `SocketContext`:
- **Room Subscriptions**:
  - `user:<userId>`: Listens for personal notifications (defaulter alerts, device reset approvals, manual attendance adjustments).
  - `session:<sessionId>`: Joined by teachers during live sessions to receive incoming `attendance:marked` events in real time.
  - `batch:<batchId>:section:<sectionName>`: Joined by students to receive real-time `session:started` notifications.

---

## 4. Route Guarding & Profile Setup Flow

1. **`ProtectedRoute.jsx`**:
   - Inspects `auth.isAuthenticated` and `auth.user.role`.
   - If unauthenticated, redirects to `/login` with return target.
   - If authenticated user role does not match required roles, redirects to unauthorized fallback.

2. **First-Time Setup Enforcement (`mustChangePassword`)**:
   - If `auth.user.mustChangePassword === true` and the user is NOT on `/setup-profile`, the router automatically forces navigation to `/setup-profile`.
   - Students cannot mark attendance or access features until their initial password and profile details are configured.
