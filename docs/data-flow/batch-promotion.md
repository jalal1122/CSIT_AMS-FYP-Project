# Batch Promotion & Semester Lifecycle Data Flow

This document details the academic progression model for batches advancing through semesters (e.g. from Semester 1 to Semester 8), handling curriculum transitions, graduation completion, and rollback contingencies.

---

## Promotion Workflow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Promotion Dashboard
    participant Backend as Express Server
    participant DB as MongoDB

    Admin->>UI: Select Batch & Review Enrolled Students
    UI->>Backend: POST /api/v2/academic/batch/:id/promote
    
    critical Atomic Promotion Transaction
        Backend->>DB: 1. Validate currentSemester < totalSemesters
        Backend->>DB: 2. Store previousSemester = currentSemester
        Backend->>DB: 3. Increment currentSemester += 1
        Backend->>DB: 4. Deactivate old CourseAllocations (isActive = false)
        Backend->>DB: 5. Fetch new Semester Subjects (from semesterSubjects OR syllabus)
        Backend->>DB: 6. Pre-generate CourseAllocations for each active section with teacherId: null
        Backend->>DB: 7. Update enrolled Student Users info.semester = newSemester
    end

    Backend-->>UI: 200 OK (Batch successfully promoted to Semester N+1)
    UI-->>Admin: Display Promotion Success & Redirect to Course Allocation

    opt If Mistakenly Promoted: Rollback Flow
        Admin->>UI: Click "Rollback Promotion"
        UI->>Backend: POST /api/v2/academic/batch/:id/rollback
        Backend->>DB: Revert currentSemester = previousSemester
        Backend->>DB: Reactivate previous CourseAllocations
        Backend->>DB: Revert Student Users info.semester
        Backend-->>UI: 200 OK (Batch reverted successfully)
    end
```

---

## Batch Graduation / Completion Flow
When a batch reaches its final semester (e.g., Semester 8):
1. Admin triggers `POST /api/v2/academic/batch/:id/complete`.
2. System sets `currentSemester = 0` and `isActive = false`.
3. All enrolled student accounts are archived (`isActive = false`).
4. Course allocations are frozen.
5. All attendance and session histories remain permanently readable for transcript generation and institutional audits.
