# Session Management API Documentation

Base URL: `/api/v2/sessions`

## Overview
The Session Management module handles the real-time lifecycle of lecture, lab, and exam attendance sessions. It powers teacher-controlled live sessions, dynamic rotating QR code generation, active attendance sockets, anti-fraud parameters, and retroactive session logging.

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/start` | Teacher, Admin | Start a live attendance session with security configuration |
| `POST` | `/retroactive` | Teacher, Admin | Log a past attendance session manually |
| `GET` | `/active` | Teacher, Admin | Get the currently active session for the authenticated teacher |
| `GET` | `/active-all` | Admin | List all active sessions across all teachers and departments |
| `GET` | `/:id` | Teacher, Admin | Get session summary by ID |
| `GET` | `/:id/details` | Teacher, Admin | Get full session details including course, batch, and section info |
| `GET` | `/:id/qr` | Teacher, Admin | Generate dynamic cryptographically hashed rotating QR token |
| `GET` | `/:id/live` | Teacher, Admin | Get real-time present count, attendee list, and fraud flags |
| `PUT` | `/:id/security` | Teacher, Admin | Dynamically update live session security rules (radius, IP match, etc.) |
| `POST` | `/:id/end` | Teacher, Admin | Conclude session, mark unrecorded students as Absent, and emit Socket closure |

---

## Detailed Endpoint Specifications

### 1. Start Live Session
`POST /api/v2/sessions/start`

Initiates an active attendance session for a specific course allocation and section. Emits a `session:started` Socket event to notify enrolled students.

**Headers:**
```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "allocationId": "65b8c9d1e2f3a4b5c6d7e8f0",
  "sectionName": "A",
  "type": "Lecture",
  "latitude": 33.6844,
  "longitude": 73.0479,
  "securityConfig": {
    "radius": 50,
    "ipMatchEnabled": true,
    "deviceLockEnabled": true,
    "qrRefreshRate": 20,
    "manualApproval": false
  }
}
```

**Response (`201 Created`):**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "65b8ca12e2f3a4b5c6d7e8f9",
    "allocationId": "65b8c9d1e2f3a4b5c6d7e8f0",
    "sectionName": "A",
    "teacherId": "65b8c8a1e2f3a4b5c6d7e8e1",
    "startTime": "2026-09-16T10:00:00.000Z",
    "active": true,
    "teacherIP": "192.168.1.105",
    "type": "Lecture",
    "securityConfig": {
      "radius": 50,
      "ipMatchEnabled": true,
      "deviceLockEnabled": true,
      "qrRefreshRate": 20,
      "manualApproval": false
    }
  },
  "message": "Session started successfully"
}
```

---

### 2. Generate Dynamic Rotating QR Token
`GET /api/v2/sessions/:id/qr`

Generates a time-bounded, salted cryptographic payload encoded into a QR code data string. The token expires based on the session's configured `qrRefreshRate` (default: 20 seconds).

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "qrToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expiresIn": 20,
    "refreshInterval": 20
  },
  "message": "QR token generated successfully"
}
```

---

### 3. Get Live Session Attendance Feed
`GET /api/v2/sessions/:id/live`

Retrieves real-time attendee records, suspicious fraud flags, and current attendance percentage.

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "sessionId": "65b8ca12e2f3a4b5c6d7e8f9",
    "totalEnrolled": 45,
    "presentCount": 38,
    "suspiciousCount": 1,
    "attendees": [
      {
        "_id": "65b8cb44e2f3a4b5c6d7e8fa",
        "student": {
          "_id": "65b8c777e2f3a4b5c6d7e8d0",
          "name": "Ali Raza",
          "username": "CS24-A-001",
          "rollNo": "CS24-A-001"
        },
        "status": "Present",
        "verificationMethod": "QR",
        "markedAt": "2026-09-16T10:05:12.000Z",
        "isSuspicious": false
      }
    ]
  },
  "message": "Live attendance retrieved"
}
```

---

### 4. End Live Session
`POST /api/v2/sessions/:id/end`

Closes the active attendance window. Performs an automatic reconciliation loop: all students enrolled in the section who did not scan or get marked are recorded with `status: "Absent"`. Emits a `session:ended` WebSocket event.

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "sessionId": "65b8ca12e2f3a4b5c6d7e8f9",
    "endTime": "2026-09-16T11:30:00.000Z",
    "active": false,
    "totalPresent": 38,
    "totalAbsent": 7,
    "attendanceRate": 84.4
  },
  "message": "Session concluded successfully"
}
```
