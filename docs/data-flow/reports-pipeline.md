# Reports & Analytics Pipeline Architecture

This document describes the universal reporting pipeline that filters, aggregates, and exports attendance analytics across Student, Teacher, and Admin roles.

---

## Architecture Diagram

```mermaid
flowchart TD
    Client["Client UI (UniversalFilterSidebar)"] -->|POST filters payload| MW["parseAntigravityFilters Middleware"]
    
    subgraph Security & Data Isolation
        MW --> RoleCheck{"User Role?"}
        RoleCheck -->|Admin| FullAccess["Allow all Department / Batch / Section / Date filters"]
        RoleCheck -->|Teacher| TeacherScope["Force teacherId = req.user._id"]
        RoleCheck -->|Student| StudentScope["Force studentId = req.user._id"]
    end
    
    subgraph Aggregation Pipeline
        FullAccess --> Aggregator["MongoDB Aggregation Pipeline"]
        TeacherScope --> Aggregator
        StudentScope --> Aggregator
        
        Aggregator --> GroupBatch["$group by Batch / Section"]
        Aggregator --> GroupSubject["$group by Subject"]
        Aggregator --> CalcStats["Compute: Present, Late, Absent, % Attendance"]
        Aggregator --> FilterDefaulters["$match percentage < threshold (Defaulters)"]
    end
    
    subgraph Output Formatting
        CalcStats --> FormatJSON["Format JSON for Dashboard Charts"]
        CalcStats --> ExcelJS["Stream Styled XLSX with ExcelJS"]
        CalcStats --> FastCSV["Stream CSV Stream with fast-csv"]
    end
    
    FormatJSON --> ResponseJSON["HTTP 200 JSON Response"]
    ExcelJS --> ResponseDownload["HTTP 200 Download Stream"]
    FastCSV --> ResponseDownload
```

---

## Aggregation Formulas

1. **Present Equivalent Sessions**:
   ```javascript
   presentSessions = count(status IN ["Present", "Present (Manual)", "Late"])
   ```
2. **Attendance Percentage**:
   ```javascript
   percentage = totalConducted > 0 
     ? Math.round((presentSessions / totalConducted) * 100) 
     : 0
   ```
3. **Defaulter Flagging**:
   - If `percentage < systemSettings.defaulterThresholdPercent` (default: 75%), student is flagged with `status: "Critical Defaulter"` and queued for automated email notifications.
