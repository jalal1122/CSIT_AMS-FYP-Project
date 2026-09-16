# Batch Schema Documentation

Collection: `batches`  
Model File: `backend/src/models/batch.model.js`

## Schema Definition

```typescript
interface ISection {
  _id: ObjectId;
  name: string;                   // "A", "B", "Morning", "CS-01", etc.
  status: "active" | "archived";  // default: "active"
  studentCount: number;           // denormalized count of enrolled students
  createdAt: Date;
  updatedAt: Date;
}

interface ISemesterSubjects {
  semester: number;               // 1 to 10
  subjects: ObjectId[];           // References Subject model
}

interface IBatch {
  _id: ObjectId;
  name: string;                   // Unique e.g. "BSCS - Fall 2024"
  disciplineId: ObjectId;         // References Discipline model
  departmentId: ObjectId;         // References Department model
  startingYear: number;           // e.g. 2024
  currentSemester: number;        // 1 to 8, 0 = completed/graduated
  isActive: boolean;              // true = active, false = completed/archived
  previousSemester: number | null;// used for promotion rollback
  sections: ISection[];           // manually created sections
  semesterSubjects: ISemesterSubjects[]; // per-batch subject overrides
  createdAt: Date;
  updatedAt: Date;
}
```

## Key Fields & Lifecycle Rules

### 1. `sections`
- Replaces legacy auto-section formula `Math.ceil(studentCount / maxStudentsPerSection)`.
- Sections can be named freely (e.g. single letters "A", "B" or descriptive words "Morning", "Evening").
- Each section tracks its own `studentCount` cache which increments on per-section Excel uploads.
- When an admin deletes an empty section (`studentCount === 0`), it is pulled from `batch.sections` and all active `CourseAllocation.sections`.
- When an admin archives a section, `status` is set to `"archived"`.

### 2. `semesterSubjects`
- Stores custom subject allocations for this specific batch per semester.
- Takes precedence over `Discipline.syllabus`. If this array does not contain an entry for `batch.currentSemester`, the system falls back to `Discipline.syllabus`.

### 3. `isActive` and `currentSemester`
- Active batches have `isActive: true` and `currentSemester >= 1`.
- Completed batches have `isActive: false` and `currentSemester: 0`.
- Deletion is guarded: only inactive batches (or empty newly-created batches) can be permanently deleted.

## Indexes
- Unique index on `name`.
- Compound index on `{ disciplineId: 1, currentSemester: 1 }`.
- Index on `departmentId`.
- Index on `isActive`.
