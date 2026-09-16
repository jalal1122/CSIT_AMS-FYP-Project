# Analytics & Reporting API Documentation

Base URL: `/api/v2/analytics`

## Overview
The Analytics & Reporting engine aggregates live attendance records, calculates attendance percentages, detects defaulters (<75% threshold), and streams formatted Excel (`.xlsx`) or CSV reports.

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/dashboard` | Admin | Get high-level KPI cards, attendance trends, and system distributions |
| `POST` | `/generate` | Admin, Teacher, Student | Aggregate attendance reports based on universal query filters |
| `POST` | `/export` | Admin, Teacher | Export aggregated reports to styled `.xlsx` or `.csv` streams |

---

## Universal Filter Pipeline (`parseAntigravityFilters`)

All report generation and export requests pass through the universal query filter middleware. This enforces data isolation based on role:
- **Admin**: Can query any department, discipline, batch, section, teacher, or student across all date ranges.
- **Teacher**: Automatically scoped to allocations where `teacherId === req.user._id`.
- **Student**: Scoped exclusively to their own student record `studentId === req.user._id`.

### Supported Filter Matrix:
```json
{
  "departmentId": "65b8...",
  "disciplineId": "65b8...",
  "batchId": "65b8...",
  "section": "A",
  "subjectId": "65b8...",
  "teacherId": "65b8...",
  "studentId": "65b8...",
  "status": "Present",
  "dateFrom": "2026-09-01",
  "dateTo": "2026-09-30",
  "reportType": "subject_wise"
}
```

---

## Detailed Endpoint Specifications

### 1. Admin Dashboard Statistics
`GET /api/v2/analytics/dashboard`

Retrieves summary statistics for the executive dashboard.

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "totalStudents": 420,
    "totalTeachers": 28,
    "activeBatches": 6,
    "todaySessions": 14,
    "averageAttendance": 87.6,
    "defaultersCount": 18,
    "weeklyAttendanceTrend": [
      { "date": "2026-09-10", "percentage": 88.2 },
      { "date": "2026-09-11", "percentage": 86.4 }
    ],
    "departmentDistribution": [
      { "name": "ICSIT", "studentCount": 420 }
    ]
  },
  "message": "Dashboard statistics retrieved"
}
```

---

### 2. Generate Universal Report
`POST /api/v2/analytics/generate`

**Request Body:**
```json
{
  "reportType": "defaulters",
  "batchId": "65b8ca00e2f3a4b5c6d7e8e0",
  "threshold": 75
}
```

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "reportType": "defaulters",
    "totalRecords": 3,
    "records": [
      {
        "studentId": "65b8c777e2f3a4b5c6d7e8d5",
        "name": "Hamza Tariq",
        "rollNo": "CS24-A-012",
        "totalConducted": 24,
        "totalPresent": 15,
        "percentage": 62.5,
        "status": "Critical Defaulter"
      }
    ]
  },
  "message": "Report generated successfully"
}
```

---

### 3. Export Report (`XLSX` / `CSV`)
`POST /api/v2/analytics/export`

Streams a binary styled spreadsheet.

**Request Body:**
```json
{
  "reportType": "class_roster",
  "allocationId": "65b8c9d1e2f3a4b5c6d7e8f0",
  "format": "xlsx"
}
```

**Response (`200 OK`):**
- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition`: `attachment; filename="Attendance_Report_CS-201_SecA.xlsx"`
