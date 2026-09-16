# Authentication API Documentation

Base URL: `/api/v2/auth`

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/login` | Public | Login with email or username & password |
| `POST` | `/verify-2fa` | Public | Verify TOTP code for 2FA-enabled accounts |
| `POST` | `/refresh-token` | Public | Generate new access token using refresh token |
| `POST` | `/logout` | Authenticated | Invalidate refresh token and clear cookies |
| `POST` | `/setup-profile` | First-time users | Set initial permanent password & recovery email |
| `POST` | `/forgot-password` | Public | Send password reset token to user's registered email |
| `POST` | `/reset-password` | Public | Reset password using valid reset token |
| `GET` | `/me` | Authenticated | Retrieve currently authenticated user profile |
| `PATCH` | `/update-account` | Authenticated | Update user profile details |
| `POST` | `/change-password` | Authenticated | Change password for logged in user |
| `POST` | `/generate-2fa` | Authenticated | Generate QR code and secret for 2FA setup |
| `POST` | `/enable-2fa` | Authenticated | Verify and activate 2FA for account |
| `POST` | `/disable-2fa` | Authenticated | Deactivate 2FA for account |

---

## Per-User Login Lockout Mechanism

Unlike traditional IP-wide rate limiting that blocks entire university labs or shared networks when one user fails authentication, AttendX employs **per-user database-persisted lockout tracking**:

- Each `User` document maintains `loginAttempts: Number` (default: 0) and `lockUntil: Date` (default: null).
- **Threshold**: 5 consecutive failed login attempts.
- **Lock Duration**: 15 minutes (`15 * 60 * 1000` ms).
- **Lockout Response**: Returns HTTP `403 Forbidden` with error code `ACCOUNT_LOCKED` and the exact minutes remaining before unlock.
- **Reset on Success**: When valid credentials are provided, `loginAttempts` is reset to 0 and `lockUntil` is cleared.
- **Admin Override**: Administrators can immediately unlock any locked account using `POST /api/v2/admin/users/:id/unlock`.
- **IP Flood Protection**: The IP-level rate limiter is retained as an outer bot guard (500 requests per 15 minutes per IP) to prevent denial-of-service floods.

---

## Detailed Endpoint Contracts

### 1. User Login
- **Route**: `POST /api/v2/auth/login`
- **Request Body**:
```json
{
  "identifier": "student_roll_no_or_email",
  "password": "UserPassword123!",
  "deviceId": "browser-fingerprint-uuid"
}
```
- **Responses**:
  - `200 OK` (Standard login success): Returns user object and sets `accessToken` / `refreshToken` httpOnly cookies.
  - `200 OK` (`requires2FA: true`): Returns temporary 2FA token if two-factor is enabled.
  - `401 Unauthorized`: "Invalid email or password" (increments `loginAttempts`).
  - `403 Forbidden`: "Account locked due to too many failed attempts. Try again in X minute(s)." (`code: ACCOUNT_LOCKED`).
  - `403 Forbidden`: "Your account is Inactive/Suspended. Contact administrator."

### 2. Admin Unlock User Account
- **Route**: `POST /api/v2/admin/users/:id/unlock`
- **Access**: Admin only (`verifyJWT`, `hasRole(["admin"])`)
- **Response**:
```json
{
  "statusCode": 200,
  "data": {
    "userId": "64b8f...",
    "username": "cs2024_01",
    "unlocked": true
  },
  "message": "User account unlocked successfully"
}
```
