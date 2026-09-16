# Academic Foundation Schema Documentation

This document covers the core academic master entities: **Department**, **Discipline**, and **Subject**.

---

## 1. Department Schema
Collection: `departments`  
Model File: `backend/src/models/department.model.js`

```typescript
interface IDepartment {
  _id: ObjectId;
  name: string;                   // Unique e.g. "Institute of Computer Science & Information Technology"
  code: string;                   // Unique uppercase e.g. "ICSIT"
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. Discipline Schema
Collection: `disciplines`  
Model File: `backend/src/models/discipline.model.js`

Represents an academic degree program offering (e.g., BS Computer Science, BS Software Engineering).

```typescript
interface ISemesterSyllabus {
  semester: number;               // 1 to 10
  subjects: ObjectId[];           // Array of references to Subject model
}

interface IDiscipline {
  _id: ObjectId;
  name: string;                   // Unique e.g. "Bachelor of Science in Computer Science"
  code: string;                   // Unique uppercase e.g. "BSCS"
  departmentId: ObjectId;         // References Department model
  totalSemesters: number;         // 1 to 10 (default: 8)
  syllabus: ISemesterSyllabus[];  // Default curriculum mapping
  createdAt: Date;
  updatedAt: Date;
}
```

### Relationship with Batches
The `syllabus` serves as the institutional master curriculum template. Individual batches inherit this syllabus by default unless overridden by `Batch.semesterSubjects`.

---

## 3. Subject Schema
Collection: `subjects`  
Model File: `backend/src/models/subject.model.js`

Represents an individual course offering.

```typescript
interface ISubject {
  _id: ObjectId;
  name: string;                   // e.g. "Data Structures & Algorithms"
  code: string;                   // Unique uppercase e.g. "CS-201"
  creditHours: number;            // 1 to 6
  departmentId: ObjectId;         // References Department model
  isArchived: boolean;            // default: false (soft-archived)
  createdAt: Date;
  updatedAt: Date;
}
```

### Compound Index:
`{ departmentId: 1, isArchived: 1 }`
Enables fast queries for all active subjects under a specific department.
