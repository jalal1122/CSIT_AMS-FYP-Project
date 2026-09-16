# Live QR Attendance Flow Architecture

This document details the end-to-end data flow for live attendance verification using rotating cryptographic QR codes, anti-fraud evaluation, and real-time WebSocket tallying.

---

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    actor Student
    participant TeacherUI as Teacher Browser
    participant StudentUI as Student Mobile
    participant Backend as Express Server
    participant DB as MongoDB
    participant Socket as Socket.io Server

    Teacher->>TeacherUI: Click "Start Attendance Session"
    TeacherUI->>Backend: POST /api/v2/sessions/start (with Geo & Security Config)
    Backend->>DB: Create Session record (active: true)
    Backend->>Socket: Broadcast "session:started" (room: batch:section)
    Backend-->>TeacherUI: Return Session Object

    loop Every 20 Seconds (qrRefreshRate)
        TeacherUI->>Backend: GET /api/v2/sessions/:id/qr
        Backend->>Backend: Generate signed JWT payload (salt + timestamp + sessionId)
        Backend-->>TeacherUI: Return Base64 QR Image + Token String
        TeacherUI->>TeacherUI: Render Rotating QR on Projector/Screen
    end

    Student->>StudentUI: Open Scan Screen & Aim Camera
    StudentUI->>StudentUI: Capture Geolocation (Lat, Lng) & Device Fingerprint
    StudentUI->>Backend: POST /api/v2/attendance/mark (qrToken, coords, deviceId)
    
    critical Anti-Fraud Verification Pipeline
        Backend->>Backend: 1. Verify token cryptographic signature & expiry window
        Backend->>DB: 2. Check Session is still active & Student is enrolled
        Backend->>Backend: 3. Verify Device Lock (match stored deviceId)
        Backend->>Backend: 4. Haversine Radius Check (distance <= securityConfig.radius)
        Backend->>Backend: 5. Subnet IP Check (Student IP vs Teacher IP)
    end

    alt Fraud Check Failed / Out of Bounds
        Backend-->>StudentUI: 403 Forbidden (DEVICE_MISMATCH / OUT_OF_RANGE)
    else Verification Success
        Backend->>DB: Upsert Attendance (status: "Present", isSuspicious: false/true)
        Backend->>Socket: Emit "attendance:marked" to session room
        Backend-->>StudentUI: 200 OK (Marked as Present)
        Socket-->>TeacherUI: Push Real-Time Attendee update
        TeacherUI->>TeacherUI: Increment live tally & append student to live roster
    end

    Teacher->>TeacherUI: Click "End Session"
    TeacherUI->>Backend: POST /api/v2/sessions/:id/end
    Backend->>DB: Set session.active = false
    Backend->>DB: Bulk insert "Absent" records for non-attending enrolled students
    Backend->>Socket: Emit "session:ended"
    Backend-->>TeacherUI: Return Final Session Summary
```

---

## Anti-Fraud Security Layers

### 1. Dynamic Rotating QR (Anti-Replay / Anti-Screenshot)
- The QR code changes dynamically every 20 seconds.
- The payload is a signed JWT containing `sessionId`, `generatedAt`, and a cryptographic hash.
- Expired tokens or screenshots sent via messaging apps are automatically rejected.

### 2. Device Fingerprint Locking (Anti-Buddy Punching)
- On first scan, the student's mobile hardware fingerprint (`deviceId`) is bound to their `User` record in MongoDB.
- Subsequent scans must match this `deviceId`.
- A single physical smartphone cannot be used to log attendance for multiple student accounts.
- Hardware resets require an administrative override logged in `DeviceResetLog`.

### 3. Geofencing (Haversine Distance)
- The teacher's browser records GPS coordinates when launching the session.
- The student's device submits high-accuracy GPS coordinates during scanning.
- If distance exceeds the classroom threshold (default: 50 meters), the scan is either rejected or flagged as `isSuspicious = true`.

### 4. IP Subnet Matching
- The teacher's local network IP is captured at session launch.
- The student's client IP is inspected to verify they are connected to the same campus Wi-Fi network rather than remote cellular data.
