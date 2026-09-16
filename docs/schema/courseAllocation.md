# Course Allocation Schema Documentation

Collection: `courseallocations`  
Model File: `backend/src/models/courseAllocation.model.js`

## Schema Definition

```typescript
interface IAllocationSection {
  name: string;                         // Matches section name in Batch
  teacherId: ObjectId | null;           // References User (teacher)
  students: ObjectId[];                 // Array of User (student) IDs in this section
  allowRetroactiveSessions: boolean;   // Default: false (Admin toggleable)
}

interface ICourseAllocation {
  _id: ObjectId;
  subjectId: ObjectId;                  // References Subject
  batchId: ObjectId;                    // References Batch
  semester: number;                     // 1 to 8
  sections: IAllocationSection[];       // Section-wise teacher & student assignments
  isActive: boolean;                    // Default: true, set false on batch promotion/completion
  createdAt: Date;
  updatedAt: Date;
}
```

## Lifecycle Operations

1. **Assignment (`POST /allocation/assign`)**:
   - Admin allocates a subject to a batch for a semester.
   - For each section, a teacher is assigned and students currently matching `info.batchId` and `info.section` are populated into `students[]`.
   - Any subject can be allocated to any batch (curriculum gate removed).
2. **Dynamic Section Synchronization**:
   - When a new section is added to a batch via `POST /batch/:id/section`, the section is pushed to all active `CourseAllocation` records for that batch with empty assignments.
   - When a section is deleted via `DELETE /batch/:id/section/:name`, it is pulled from all `CourseAllocation` documents.
3. **Completion & Promotion**:
   - Marking a batch complete or promoting it deactivates all related `CourseAllocation` records (`isActive = false`).
