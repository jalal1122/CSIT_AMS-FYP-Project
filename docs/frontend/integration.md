# Frontend Integration & Redux Architecture

## Academic & Batch Management Workflow

### Redux Slices & Async Thunks

The frontend interacts with the backend academic subsystem through `academicSlice.js`:

| Thunk | Action Type | HTTP Endpoint | Redux State Impact |
|---|---|---|---|
| `fetchBatches` | `academic/fetchBatches` | `GET /api/v2/academic/batches` | Updates `batches` array |
| `fetchBatchDetails` | `academic/fetchBatchDetails` | `GET /api/v2/academic/batch/:id` | Sets `currentBatch` |
| `createBatch` | `academic/createBatch` | `POST /api/v2/academic/batch/create` | Appends to `batches` |
| `updateBatch` | `academic/updateBatch` | `PATCH /api/v2/academic/batch/:id` | Updates batch in `batches` |
| `completeBatch` | `academic/completeBatch` | `POST /api/v2/academic/batch/:id/complete` | Updates status in `batches` |
| `deleteBatch` | `academic/deleteBatch` | `DELETE /api/v2/academic/batch/:id` | Removes batch from `batches` |
| `uploadSectionStudents` | `academic/uploadSectionStudents` | `POST /api/v2/academic/batch/:id/section/:name/upload` | Updates `section.studentCount` |
| `addSection` | `academic/addSection` | `POST /api/v2/academic/batch/:id/section` | Appends section to `currentBatch` |
| `deleteSection` | `academic/deleteSection` | `DELETE /api/v2/academic/batch/:id/section/:name` | Removes section from `currentBatch` |
| `archiveSection` | `academic/archiveSection` | `PATCH /api/v2/academic/batch/:id/section/:name/archive` | Updates section status |
| `fetchBatchSubjects` | `academic/fetchBatchSubjects` | `GET /api/v2/academic/batch/:id/subjects` | Sets `batchSubjects` |
| `setBatchSubjects` | `academic/setBatchSubjects` | `POST /api/v2/academic/batch/:id/subjects` | Updates `batchSubjects` |

---

## UI Components & Modals

1. **`BatchCreate.jsx`**:
   - 5-step interactive wizard:
     - Step 1: Department selection
     - Step 2: Discipline selection and batch naming
     - Step 3: Manual section definition (type section names, add/remove badges)
     - Step 4: Batch shell creation confirmation
     - Step 5: Per-section Excel file drop zones with live upload progress and duplicate reporting.
2. **`BatchSectionsModal.jsx`**:
   - Accessible via the table row on the Batch page.
   - Shows list of all sections, active/archived status, and student counts.
   - Allows inline file upload per section, adding new sections mid-batch, archiving empty sections, and deleting 0-student sections.
3. **`ManageBatchSubjectsModal.jsx`**:
   - Accessible from the Course Allocation page.
   - Allows search and multi-selection of subjects for the batch's active semester.
   - Provides a "Reset to Curriculum Template" shortcut to revert to discipline default.
4. **`CompleteBatchModal.jsx` & `DeleteBatchModal.jsx`**:
   - Guarded modals with multi-step confirmation:
     - Complete: requires typing exact batch name.
     - Delete: requires typing exact batch name AND the confirmation keyword "DELETE".
