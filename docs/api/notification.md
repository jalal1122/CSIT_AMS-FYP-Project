# Notification API Documentation

Base URL: `/api/v2/notifications`

## Overview
The Notification module delivers targeted system announcements, live session alerts, attendance updates, and defaulter warnings. It supports real-time dispatch via Socket.io and persistent database storage with automatic 30-day TTL expiration.

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | List notifications for authenticated user with unread count |
| `PATCH` | `/read-all` | Authenticated | Mark all user notifications as read |
| `PATCH` | `/:id/read` | Authenticated | Mark a single notification as read |
| `DELETE` | `/read` | Authenticated | Bulk purge all read notifications for current user |
| `DELETE` | `/:id` | Authenticated | Delete a specific notification by ID |

---

## Notification Categories

- `session_started`: Sent to enrolled students when a teacher opens a live attendance session.
- `attendance_updated`: Sent to a student when a teacher manually overrides an attendance record.
- `warning`: Sent when a student's attendance drops below the institute defaulter threshold (<75%).
- `system`: Administrative announcements, device resets, or password change reminders.

---

## Sample Request & Response

### Get Notifications
`GET /api/v2/notifications`

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "unreadCount": 2,
    "notifications": [
      {
        "_id": "65b8e100e2f3a4b5c6d7e900",
        "type": "session_started",
        "title": "Live Session Active",
        "message": "Dr. Kamran Ali started attendance for Data Structures (CS-201) - Section A",
        "link": "/student/scan",
        "isRead": false,
        "createdAt": "2026-09-16T10:00:15.000Z"
      }
    ]
  },
  "message": "Notifications retrieved successfully"
}
```
