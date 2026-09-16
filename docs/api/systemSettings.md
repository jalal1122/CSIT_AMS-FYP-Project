# System Settings API Documentation

Base URL: `/api/v2/system-settings`

## Overview
Stores global configuration variables for the entire AttendX deployment, including default geofence radius, QR rotation interval, anti-buddy punching policies, institute branding, and defaulter attendance thresholds.

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Public | Retrieve public system settings (branding, features, default radius) |
| `PUT` | `/` | Admin | Update system settings key-value configuration |

---

## Default System Settings Schema & Values

| Key | Type | Default | Description |
|---|---|---|---|
| `defaultRadiusMeters` | Number | `50` | Default geo-fence circle around teacher coordinates in meters |
| `qrRefreshSeconds` | Number | `20` | Interval before dynamic QR token regenerates |
| `defaulterThresholdPercent`| Number | `75` | Minimum attendance required before triggering warning notifications |
| `allowManualAttendance` | Boolean | `true` | Enables teacher manual override in live sessions |
| `enforceDeviceLock` | Boolean | `true` | Restricts student scanning to one verified mobile device ID |
| `instituteName` | String | `"ICSIT"` | University department or institute display name |
| `lockoutMaxAttempts` | Number | `5` | Maximum failed password attempts before account lockout |
| `lockoutDurationMinutes` | Number | `15` | Temporary lockout duration in minutes |

---

## Sample Request & Response

### Update System Settings
`PUT /api/v2/system-settings`

**Request Body:**
```json
{
  "key": "defaultRadiusMeters",
  "value": 45,
  "description": "Geofence boundary around teacher device"
}
```

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "key": "defaultRadiusMeters",
    "value": 45,
    "description": "Geofence boundary around teacher device"
  },
  "message": "System setting updated successfully"
}
```
