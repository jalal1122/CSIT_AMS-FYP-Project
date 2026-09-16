# Admin Management API Documentation

Base URL: `/api/v2/admin`

## Overview
The Admin Management module provides high-privilege operational endpoints for managing university user accounts, binding/resetting student mobile device fingerprints, reassigning teaching staff, transferring students between sections, and overriding security lockouts.

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | List users with role, department, section, and search filtering |
| `POST` | `/users` | Admin | Create single user (Admin, Teacher, or Student) |
| `PUT` | `/users/:id` | Admin | Update user profile, contact information, and role attributes |
| `PATCH` | `/users/:id/status` | Admin | Toggle user active status (`isActive: true/false`) |
| `PATCH` | `/users/:id/reset-device` | Admin | Clear bound `deviceId` to permit new device registration |
| `PATCH` | `/users/:id/reset-password` | Admin | Administrative password override (triggers `mustChangePassword`) |
| `PUT` | `/users/:id/transfer` | Admin | Transfer student to another batch or section |
| `POST` | `/users/:id/unlock` | Admin | Clear consecutive failed login attempts and unlock account |
| `POST` | `/teacher/:id/offboard` | Admin | Deactivate teacher and safely unlink or reassign active allocations |
| `PATCH` | `/allocation/:id/reassign-teacher`| Admin | Reassign a course section allocation to a different teacher |
| `PATCH` | `/allocation/:id/retroactive` | Admin | Grant or revoke retroactive session creation permission |
| `PUT` | `/subject/:id/archive` | Admin | Toggle subject archived status |

---

## Detailed Endpoint Specifications

### 1. Device Reset
`PATCH /api/v2/admin/users/:id/reset-device`

Resets the stored mobile device identifier for a student. The action creates an immutable audit trail in `DeviceResetLog`.

**Request Body:**
```json
{
  "reason": "Student replaced broken phone (approved by department head)"
}
```

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "userId": "65b8c777e2f3a4b5c6d7e8d0",
    "deviceId": null,
    "resetLogged": true
  },
  "message": "Device ID reset successfully. Student can now bind a new device."
}
```

---

### 2. Administrative User Unlock
`POST /api/v2/admin/users/:id/unlock`

Clears consecutive failed login attempts (`loginAttempts = 0`) and expires lockout timestamp (`lockUntil = null`), instantly restoring account access.

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "userId": "65b8c777e2f3a4b5c6d7e8d0",
    "isLocked": false,
    "loginAttempts": 0
  },
  "message": "User account unlocked successfully"
}
```

---

### 3. Transfer Student
`PUT /api/v2/admin/users/:id/transfer`

Transfers a student between sections or batches. Updates the student's `info.section`, recalculates `studentCount` across source and target batches, and syncs allocations.

**Request Body:**
```json
{
  "targetBatchId": "65b8ca00e2f3a4b5c6d7e8e0",
  "targetSection": "B"
}
```

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "studentId": "65b8c777e2f3a4b5c6d7e8d0",
    "previousSection": "A",
    "newSection": "B",
    "batchId": "65b8ca00e2f3a4b5c6d7e8e0"
  },
  "message": "Student transferred successfully"
}
```

---

### 4. Reassign Course Allocation Teacher
`PATCH /api/v2/admin/allocation/:id/reassign-teacher`

Replaces the assigned teacher on an active course allocation without affecting existing attendance logs or student rosters.

**Request Body:**
```json
{
  "newTeacherId": "65b8c8a1e2f3a4b5c6d7e8e5"
}
```

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "allocationId": "65b8c9d1e2f3a4b5c6d7e8f0",
    "teacherId": "65b8c8a1e2f3a4b5c6d7e8e5"
  },
  "message": "Teacher reassigned successfully"
}
```
