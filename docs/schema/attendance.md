# Attendance Schema Documentation

Collection: `attendances`  
Model File: `backend/src/models/attendance.model.js`

## Schema Definition

```typescript
interface IAttendanceMetadata {
  ipAddress?: string;
  distanceFromTeacher?: number;   // In meters (Haversine calculation)
  flagReason?: string;            // Reason if marked suspicious (e.g. "IP Subnet Mismatch")
}

interface IAttendance {
  _id: ObjectId;
  sessionId: ObjectId;            // References Session model (required)
  studentId: ObjectId;            // References User model (required)
  allocationId: ObjectId;         // References CourseAllocation model (required)
  status: "Present" | "Present (Manual)" | "Absent" | "Late" | "Leave" | "Pending";
  verificationMethod: "QR" | "Manual";
  deviceId?: string;              // Client mobile browser fingerprint
  section?: string;               // Section name (e.g. "A")
  isSuspicious: boolean;          // Flagged for anomalous location or IP
  metadata?: IAttendanceMetadata;
  date: Date;                     // ISO Timestamp of attendance date
  weekNumber: number;             // Auto-computed ISO week (1-53)
  month: number;                  // Auto-computed month (1-12)
  year: number;                   // Auto-computed calendar year
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Pre-Save Middleware Hook

The attendance schema automatically derives temporal calendar metrics on save from `this.date`:
```javascript
attendanceSchema.pre("save", function (next) {
  if (this.date) {
    const date = new Date(this.date);
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
    this.weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
    this.month = date.getMonth() + 1;
    this.year = date.getFullYear();
  }
  next();
});
```
This enables lightning-fast monthly, weekly, and annual report aggregations without requiring expensive runtime `$dateToString` pipeline operators.

---

## Database Indexes

| Index Keys | Type | Purpose |
|---|---|---|
| `{ sessionId: 1, studentId: 1 }` | Unique Compound | Hard database constraint preventing double marking |
| `{ allocationId: 1, date: 1 }` | Compound | Fast retrieval of session attendance history |
| `{ studentId: 1, date: 1 }` | Compound | Student personal attendance timeline |
| `{ allocationId: 1, weekNumber: 1 }` | Compound | Weekly attendance aggregation |
| `{ allocationId: 1, month: 1, year: 1 }`| Compound | Monthly report generator |
| `{ allocationId: 1, status: 1 }` | Compound | Defaulter & present status counting |
| `{ allocationId: 1, isSuspicious: 1 }` | Compound | Security dashboard anomaly audit |
| `{ deviceId: 1 }` | Single Field | Device fingerprint lookup |
