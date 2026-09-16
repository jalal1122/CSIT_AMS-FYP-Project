# Session Schema Documentation

Collection: `sessions`  
Model File: `backend/src/models/session.model.js`

## Schema Definition

```typescript
interface ISessionSecurityConfig {
  radius: number;                 // Geo-fence circle around teacher in meters (default: 50)
  ipMatchEnabled: boolean;        // Enforces teacher and student same subnet match (default: true)
  deviceLockEnabled: boolean;     // Enforces one student per physical device (default: false)
  qrRefreshRate: number;          // Interval for rotating QR code in seconds (default: 20)
  manualApproval: boolean;        // Requires teacher confirmation for each scan (default: false)
}

interface ISessionLocation {
  latitude?: number;
  longitude?: number;
}

interface ISession {
  _id: ObjectId;
  allocationId: ObjectId;         // References CourseAllocation model (required)
  sectionName: string;            // Uppercase section identifier e.g. "A"
  teacherId: ObjectId;            // References User model (teacher)
  startTime: Date;                // Session launch timestamp
  endTime?: Date;                 // Session conclusion timestamp
  active: boolean;                // true = open for scanning, false = closed
  isRetroactive: boolean;         // true if created retroactively by teacher
  qrCodeHash?: string;            // SHA256 signature of the current active QR token
  teacherIP: string;              // Client IP address of the teacher device
  type: "Lecture" | "Lab" | "Exam"; // Default: "Lecture"
  location?: ISessionLocation;
  securityConfig: ISessionSecurityConfig;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Lifecycle Rules

1. **Active State (`active: true`)**:
   - Only one active session per teacher can exist concurrently.
   - While `active: true`, students enrolled in `allocationId` and `sectionName` can scan the rotating QR code.
   - Dynamic QR tokens are verified against `qrCodeHash` and time window.

2. **Concluding Session (`active: false`)**:
   - Calling `POST /api/v2/sessions/:id/end` sets `active = false` and records `endTime = new Date()`.
   - Any student enrolled in the section who lacks an attendance record for this `sessionId` is automatically recorded with `status: "Absent"`.
   - Closes the WebSocket room `session:<sessionId>` and informs connected student clients.

---

## Database Indexes

| Index Keys | Purpose |
|---|---|
| `{ allocationId: 1, active: 1 }` | Fast check if a course section already has an open session |
| `{ teacherId: 1, active: 1 }` | Fast lookup for the teacher's current active session |
| `{ teacherId: 1, createdAt: -1 }`| Teacher's past session history timeline |
| `{ active: 1 }` | Admin monitor of all currently active sessions system-wide |
