# Notification Schema Documentation

Collection: `notifications`  
Model File: `backend/src/models/notification.model.js`

## Schema Definition

```typescript
type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "session_started"
  | "attendance_updated"
  | "system";

interface INotification {
  _id: ObjectId;
  userId: ObjectId;               // References User model (recipient)
  type: NotificationType;         // Visual style and icon identifier
  title: string;                  // Short bold headline
  message: string;                // Detailed notification body
  link?: string;                  // Optional target URL for in-app navigation
  isRead: boolean;                // Default: false
  metadata?: Record<string, any>; // Arbitrary payloads (e.g. { sessionId, allocationId })
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Auto-Purge TTL Index

Notifications automatically expire and are purged by MongoDB 30 days after creation:
```javascript
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
```
This ensures the database collection remains compact and performant without requiring recurring manual cron deletion jobs.

---

## Database Indexes

| Index Keys | Purpose |
|---|---|
| `{ userId: 1, isRead: 1 }` | Fast retrieval of unread notifications badge count |
| `{ createdAt: 1 }` (TTL: 30 days) | Automatic MongoDB document expiration |
