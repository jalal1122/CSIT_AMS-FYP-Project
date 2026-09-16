# Academic API Documentation

Base URL: `/api/v2/academic`

## Overview
The Academic Management module manages batches, section definitions, student rosters, per-batch curriculum overrides, course allocations, semester promotions, and teacher roster views.

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/batch/create` | Admin | Create batch shell with manually defined sections (no file) |
| `GET` | `/batches` | Admin | List batches with filtering, pagination, and section info |
| `GET` | `/batch/:id` | Admin | Get single batch details including sections & subjects |
| `PATCH` | `/batch/:id` | Admin | Update batch metadata (name) |
| `POST` | `/batch/:batchId/section/:sectionName/upload` | Admin | Upload Excel roster for a specific section |
| `POST` | `/batch/:id/section` | Admin | Add a new section mid-batch (for transfers/migrants) |
| `DELETE` | `/batch/:id/section/:sectionName` | Admin | Delete an empty section (guard: studentCount === 0) |
| `PATCH` | `/batch/:id/section/:sectionName/archive` | Admin | Archive / restore a section |
| `GET` | `/batch/:id/subjects` | Admin | Get subjects for batch (custom override or curriculum default) |
| `POST` | `/batch/:id/subjects` | Admin | Assign custom subject list to a batch for a semester |
| `POST` | `/allocation/assign` | Admin | Assign teachers to sections without curriculum gates |
| `GET` | `/allocations` | Admin, Teacher | List course allocations |
| `POST` | `/batch/:id/promote` | Admin | Promote batch to next semester |
| `POST` | `/batch/:id/rollback` | Admin | Rollback batch promotion |
| `POST` | `/batch/:id/complete` | Admin | Mark batch as completed/graduated (soft-close) |
| `DELETE` | `/batch/:id` | Admin | Hard cascading deletion of batch and associated records |
| `GET` | `/teacher/courses` | Teacher | List assigned courses and sections for logged-in teacher |
| `GET` | `/allocation/:id/roster` | Teacher, Admin | Get enrolled student roster for a course allocation section |
| `GET` | `/allocation/:id/attendance` | Teacher, Admin | Get aggregated attendance sheet for allocation (Present, Late, Absent) |
| `GET` | `/allocation/:id/export` | Teacher, Admin | Export allocation attendance history to spreadsheet |
| `GET` | `/student/summary` | Student | Get student's personal course attendance summaries and aggregate % |

---

## Architecture & Workflows

### 1. Manual Section Creation & Per-Section Uploads
Instead of uploading one monolithic file and computing arbitrary sections by student capacity, AttendX splits creation into:
1. **Shell Creation**: Admin specifies Department, Discipline, starting year, and manually defines section names (e.g. `["A", "B", "Morning", "Evening"]`).
2. **Per-Section File Upload**: Admin uploads separate Excel files for each section. Student accounts are created directly tagged with `info.section = sectionName` and the section's `studentCount` cache is updated.

### 2. Mid-Batch Section Additions
When transfer or migration students arrive mid-session:
- Admin calls `POST /batch/:id/section` with `{ name: "New Section" }`.
- System creates the section on the batch document.
- System automatically propagates the section into all active `CourseAllocation` records for that batch with `{ teacherId: null, students: [] }`.

### 3. Deleting and Archiving Sections
- **Deletion**: Allowed only when `studentCount === 0`. Completely removes the section from the batch and all related `CourseAllocation` documents.
- **Archiving**: Inactivates the section (`status = "archived"`). The section remains visible for historical teacher records but is hidden from active student registration and session creation.

### 4. Per-Batch Subject Allocation (Curriculum Overrides)
- Each `Batch` document can have a `semesterSubjects` array that overrides the discipline syllabus for any semester.
- `GET /batch/:id/subjects` checks `batch.semesterSubjects` first; if not present, it gracefully falls back to `discipline.syllabus`.
- `allocateCourse` no longer rejects subjects that are not in the discipline syllabus, allowing full departmental flexibility.

### 5. Attendance Calculations & Statuses
In `GET /allocation/:id/attendance` and student dashboards:
- **Present Count**: Calculated as `["Present", "Present (Manual)", "Late"].includes(status)`
- **Absent Count**: Calculated as `status === "Absent"`
- **Excused Count**: Calculated as `status === "Leave"`
- **Attendance %**: `Math.round((presentCount / totalConductedSessions) * 100)` (defended with `totalConductedSessions > 0` to prevent `NaN%`).

### 6. Batch Completion & Cascading Deletion
- **Completion (`POST /batch/:id/complete`)**: Sets `isActive = false` and `currentSemester = 0` (graduation marker). Deactivates all `CourseAllocation` documents. Data is preserved for transcripts, audit logs, and reports.
- **Cascading Deletion (`DELETE /batch/:id`)**: Permanently hard-deletes the batch inside a MongoDB session transaction (Attendance records, Session documents, CourseAllocation documents, Student accounts, and Batch document). Requires exact batch name confirmation.

---

## Sample Request & Response Payloads

### Create Batch Shell
`POST /api/v2/academic/batch/create`
```json
{
  "name": "Fall 2024",
  "departmentId": "64a1b...",
  "disciplineId": "64a1c...",
  "sections": ["A", "B", "Evening"]
}
```
Response: `201 Created`

### Upload Section Students
`POST /api/v2/academic/batch/:batchId/section/Morning/upload`
- Form-Data: `file` (Excel `.xlsx` or `.csv`)
```json
{
  "statusCode": 201,
  "data": {
    "batchId": "64a1...",
    "sectionName": "Morning",
    "totalRows": 25,
    "inserted": 25,
    "duplicates": [],
    "sectionStudentCount": 25
  },
  "message": "25 students uploaded to section Morning successfully"
}
```

### Get Teacher Courses
`GET /api/v2/academic/teacher/courses`
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "64b1...",
      "subject": { "name": "Data Structures & Algorithms", "code": "CS-201" },
      "batch": { "name": "BSCS - Fall 2024", "currentSemester": 3 },
      "section": "A",
      "totalStudents": 25
    }
  ]
}
```
