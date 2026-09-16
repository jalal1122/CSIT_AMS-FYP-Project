# System Foundation API Documentation

Base URL: `/api/v2/system`

## Overview
The System Foundation module manages the core academic infrastructure: Departments, Disciplines (Degree programs), Subjects, Curriculum maps (Syllabi), and Teacher faculty profiles.

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/department` | Admin | Create university department |
| `GET` | `/departments` | Admin | List all departments |
| `PUT` | `/department/:id` | Admin | Update department name/code |
| `DELETE` | `/department/:id` | Admin | Delete department (guarded by orphan prevention) |
| `POST` | `/discipline` | Admin | Create academic discipline (degree program) |
| `GET` | `/disciplines` | Admin | List all disciplines with department populated |
| `PUT` | `/discipline/:id` | Admin | Update discipline metadata |
| `DELETE` | `/discipline/:id` | Admin | Delete discipline (guarded by orphan prevention) |
| `GET` | `/discipline/:id/syllabus` | Admin | Retrieve the semester-wise curriculum syllabus |
| `PUT` | `/discipline/:id/syllabus` | Admin | Update the semester-wise curriculum syllabus map |
| `POST` | `/subject` | Admin | Create subject with credit hours and department |
| `GET` | `/subjects` | Admin | List all subjects |
| `GET` | `/subjects/:id` | Admin | Get subject details |
| `PUT` | `/subject/:id` | Admin | Update subject details |
| `DELETE` | `/subject/:id` | Admin | Delete subject (guarded by orphan prevention) |
| `POST` | `/teacher` | Admin | Register new teacher user account |

---

## Orphan Prevention Middleware (`preventOrphans`)

Critical entities like Departments, Disciplines, and Subjects cannot be deleted if active dependent entities exist:
- **Department**: Cannot be deleted if any Discipline or Subject references `departmentId`.
- **Discipline**: Cannot be deleted if active Batches reference `disciplineId`.
- **Subject**: Cannot be deleted if active Course Allocations or Disciplines reference `subjectId`.

---

## Detailed Endpoint Specifications

### 1. Update Curriculum Syllabus Map
`PUT /api/v2/system/discipline/:id/syllabus`

Assigns master subjects to semesters 1 through 8 (or up to 10 for 5-year programs).

**Request Body:**
```json
{
  "syllabus": [
    {
      "semester": 1,
      "subjects": ["65b8d001...", "65b8d002..."]
    },
    {
      "semester": 2,
      "subjects": ["65b8d003...", "65b8d004..."]
    }
  ]
}
```

**Response (`200 OK`):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "65b8cf00e2f3a4b5c6d7e8e8",
    "name": "BS Computer Science",
    "code": "BSCS",
    "totalSemesters": 8,
    "syllabus": [ ... ]
  },
  "message": "Syllabus updated successfully"
}
```
