# Audit & System Logs Schema Documentation

This document specifies the operational, security, and transient cache schemas: **DeviceResetLog**, **SystemTrafficLog**, **SystemSettings**, and **OTP**.

---

## 1. DeviceResetLog Schema
Collection: `deviceresetlogs`  
Model File: `backend/src/models/deviceResetLog.model.js`

Maintains a permanent audit log whenever an administrator resets a student's mobile hardware device lock.

```typescript
interface IDeviceResetLog {
  _id: ObjectId;
  studentId: ObjectId;            // References User model (target student)
  adminId: ObjectId;              // References User model (acting administrator)
  previousDeviceId: string;       // The cleared device fingerprint or UUID
  reason: string;                 // Stated rationale (e.g. "Broken phone replacement")
  createdAt: Date;
  updatedAt: Date;
}
```

### Index:
`{ createdAt: -1 }`: Optimizes administrative audit history timelines.

---

## 2. SystemTrafficLog Schema
Collection: `systemtrafficlogs`  
Model File: `backend/src/models/systemTrafficLog.model.js`

Logs API endpoint usage grouped by hour to analyze server load without creating unmanageable database bloat.

```typescript
interface ISystemTrafficLog {
  _id: ObjectId;
  endpoint: string;               // e.g. "/api/v2/attendance/mark"
  method: string;                 // "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  count: number;                  // Total hits in this hourly window
  timestampHour: Date;            // Truncated to the top of the hour
}
```

### Compound Unique Index:
`{ endpoint: 1, method: 1, timestampHour: 1 }`  
Enables atomic `$inc: { count: 1 }` upsert operations on every incoming HTTP request.

---

## 3. SystemSettings Schema
Collection: `systemsettings`  
Model File: `backend/src/models/systemSettings.model.js`

Dynamic key-value storage for university-wide behavioral thresholds.

```typescript
interface ISystemSettings {
  _id: ObjectId;
  key: string;                    // Unique setting identifier
  value: any;                     // Flexible value payload (Number, Boolean, String, Array)
  description?: string;           // Human-readable summary
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. OTP Schema
Collection: `otps`  
Model File: `backend/src/models/otp.model.js`

Stores temporary One-Time Passwords for password resets and verification.

```typescript
interface IOTP {
  _id: ObjectId;
  email: string;                  // Lowercase trimmed email address
  otp: string;                    // 6-digit numeric string
  createdAt: Date;                // Set to Date.now
}
```

### Auto-Expiring TTL Index:
`{ createdAt: 1 }` with `expires: 600` (10 minutes). MongoDB automatically purges expired codes.
