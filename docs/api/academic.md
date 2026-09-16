# Academic API Documentation

Base URL: `/api/v2/academic`

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

---

## Batch Lifecycle & Section Management Architecture

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
- Previously, subjects were strictly bound to `Discipline.syllabus` per semester.
- Now, each `Batch` document can have a `semesterSubjects` array that overrides the discipline syllabus for any semester.
- `GET /batch/:id/subjects` checks `batch.semesterSubjects` first; if not present, it gracefully falls back to `discipline.syllabus`.
- `allocateCourse` no longer rejects subjects that are not in the discipline syllabus, allowing full departmental flexibility.

### 5. Batch Completion & Cascading Deletion
- **Completion (`POST /batch/:id/complete`)**: Sets `isActive = false` and `currentSemester = 0` (graduation marker). Deactivates all `CourseAllocation` documents. Data is preserved for transcripts, audit logs, and reports.
- **Cascading Deletion (`DELETE /batch/:id`)**: Permanently hard-deletes the batch.
  - **Safety Guards**: Must supply exact `confirmName` matching the batch name. Batch must either be completed (`isActive === false`) or be an empty new batch with no allocations or sessions.
  - **Atomic Transaction**: Uses a MongoDB transaction to delete:
    1. `Attendance` records
    2. `Session` documents
    3. `CourseAllocation` documents
    4. `User` documents (students of this batch)
    5. The `Batch` document itself.

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
Response:
```json
{
  "statusCode": 201,
  "data": {
    "batchId": "64a1...",
    "sectionName": "Morning",
    "totalRows": 45,
    "inserted": 45,
    "duplicates": [],
    "sectionStudentCount": 45
  },
  "message": "45 students uploaded to section Morning successfully"
}
```

### Set Custom Batch Subjects
`POST /api/v2/academic/batch/:id/subjects`
```json
{
  "semester": 1,
  "subjectIds": ["64b1...", "64b2...", "64b3..."]
}
```
Response: `200 OK`
