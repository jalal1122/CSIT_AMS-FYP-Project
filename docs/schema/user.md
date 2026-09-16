# User Schema Documentation

Collection: `users`  
Model File: `backend/src/models/user.model.js`

## Schema Definition

```typescript
interface IUser {
  _id: ObjectId;
  name: string;
  email: string | null;            // Sparse unique index
  username: string;                // Unique index
  password: string;                // Bcrypt hash
  role: "admin" | "teacher" | "student";
  accountStatus: "Active" | "Inactive" | "Suspended";
  mustChangePassword: boolean;     // Set to false after /setup-profile
  
  info: {
    // Student specific
    rollNo?: string;
    section?: string;              // Matches Batch.sections[].name
    semester?: number;
    batchId?: ObjectId;            // References Batch
    departmentId?: ObjectId;       // References Department
    disciplineId?: ObjectId;       // References Discipline
    
    // Teacher specific
    designation?: string;
    phone?: string;
    fatherName?: string;
  };

  avatar?: string;
  refreshToken?: string;
  
  // 2FA Fields
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  mobileNumber?: string;
  
  // Anti-Buddy-Punching Device Fingerprint
  deviceId?: string;
  
  // Per-User Login Lockout Fields
  loginAttempts: number;           // Default: 0
  lockUntil: Date | null;          // Default: null
  
  // Virtuals
  isLocked: boolean;               // Returns true if lockUntil > Date.now()
  
  createdAt: Date;
  updatedAt: Date;
}
```

## Security & Lockout Implementation Details

1. **`loginAttempts`**: Incremented by 1 upon every incorrect password submission. Reset to 0 upon successful login.
2. **`lockUntil`**: Set to `Date.now() + 15 * 60 * 1000` (15 minutes) when `loginAttempts >= 5`.
3. **`isLocked` Virtual**: Evaluates `Boolean(this.lockUntil && this.lockUntil > Date.now())`.
4. **Admin Unlock**: Setting `lockUntil = null` and `loginAttempts = 0` immediately clears the lockout without waiting for the 15-minute cooldown.
