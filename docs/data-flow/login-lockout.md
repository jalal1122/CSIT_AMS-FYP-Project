# Per-User Login Lockout State Machine

```mermaid
stateDiagram-v2
    [*] --> Unlocked: Account Created

    state Unlocked {
        [*] --> Idle: loginAttempts = 0, lockUntil = null
        Idle --> FailedAttempt1: Bad Password (Attempts = 1)
        FailedAttempt1 --> FailedAttempt2: Bad Password (Attempts = 2)
        FailedAttempt2 --> FailedAttempt3: Bad Password (Attempts = 3)
        FailedAttempt3 --> FailedAttempt4: Bad Password (Attempts = 4)
        FailedAttempt4 --> LockedOut: Bad Password (Attempts = 5)
        
        FailedAttempt1 --> Idle: Successful Login
        FailedAttempt2 --> Idle: Successful Login
        FailedAttempt3 --> Idle: Successful Login
        FailedAttempt4 --> Idle: Successful Login
    }

    state LockedOut {
        [*] --> TimerActive: lockUntil = Date.now() + 15m, loginAttempts = 0
        TimerActive --> Rejected: Any Login Attempt within 15 mins (HTTP 403 ACCOUNT_LOCKED)
    }

    LockedOut --> Idle: 15 minutes elapsed (lockUntil < Date.now())
    LockedOut --> Idle: Admin manual unlock (POST /api/v2/admin/users/:id/unlock)
```

### Key Differences: Per-User vs. IP-Based Rate Limiting

| Feature | Legacy IP Rate Limiting | AttendX Per-User Lockout |
|---|---|---|
| **Scope** | Entire IP address / NAT subnet | Single `User` account only |
| **Shared Networks (Campus Labs/WiFi)** | All lab students locked if 1 fails | Only the failing student is locked |
| **Persistence** | In-memory (lost on restart) | MongoDB document (`lockUntil`, `loginAttempts`) |
| **Admin Override** | Not possible without restarting server | Admin endpoint `POST /admin/users/:id/unlock` |
| **DoS Guard** | Handled by low threshold | High outer threshold (500/15min) retains bot protection |
