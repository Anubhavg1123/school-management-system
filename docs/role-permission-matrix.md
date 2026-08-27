# Institutional Role-Permission Matrix & Access Boundaries

## 1. System Role Hierarchy

| System Role Code | Display Name | Category | Primary Portal Path | Default Permissions Scope |
|:---|:---|:---|:---|:---|
| `SUPER_ADMIN` | Principal / Director | Executive | `/principal` | Global unrestricted administrative oversight & override |
| `OFFICE_ADMIN` | Academic Office / Registrar | Administrative | `/office` | Admissions, fee collection, student records, timetable, helpdesk |
| `HOD` | Head of Department | Departmental | `/hod` | Department faculty, students, department timetable, approvals |
| `FACULTY` | Teaching Faculty | Academic | `/faculty` | Roll call, syllabus, assignments, marks entry, leave requests |
| `NON_FACULTY` | Operations Staff (Driver/Security/Attender) | Operational | `/staff` | Fleet management, gate pass logging, attendance punch |
| `STUDENT` | Enrolled Student | Learner | `/student/dashboard` | Own attendance, assignments, exam results, profile, tickets |
| `PARENT` | Guardian / Parent | Guardian | `/guardian/dashboard` | Ward attendance, results, fee notices, communications |

---

## 2. Granular Module Permission Matrix

| Module & Capability | SUPER_ADMIN | OFFICE_ADMIN | HOD | FACULTY | NON_FACULTY | STUDENT | PARENT |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **IAM / User Management** | Full (CRUD) | View / Edit | View Dept | None | None | None | None |
| **Go-Live Readiness** | View / Run | None | None | None | None | None | None |
| **Configuration Validator** | View | None | None | None | None | None | None |
| **Data Migration / CSV Import** | Full | Full | None | None | None | None | None |
| **Academic Structure (Depts/Classes)** | Full | Full | View Dept | View Assigned | None | None | None |
| **Admissions & Student Enrollment** | Full | Full | View Dept | None | None | None | None |
| **Timetable Scheduling** | Full | Full | Dept Only | View Assigned | None | View Own | View Ward |
| **Student Roll Call (Attendance)** | Override | View All | View Dept | Mark Assigned | None | None | None |
| **Attendance Corrections & Bypass** | Final Approve | Verify | Recommend | Request | None | Request (Bypass) | None |
| **Fee Structure & Billing** | Full | Full | None | None | None | None | None |
| **Fee Collection & Receipts** | Override | Execute | None | None | None | View Own | View Ward |
| **Examination Creation & Scheduling** | Full | Full | Dept Exams | None | None | None | None |
| **Marks Entry & Grading** | Override | View All | Dept Review | Enter Assigned | None | None | None |
| **Marks Verification & Approval** | Final Approve | Verify | Approve Dept | None | None | None | None |
| **Result Snapshot Publication** | Publish | Publish | Recommend | None | None | View Own | View Ward |
| **Fleet & Vehicle Logistics** | Full | Full | None | None | Execute (Driver) | None | None |
| **Visitor Entry & Campus Passes** | Full | Full | None | None | Execute (Security) | None | None |
| **Communication & Notices** | Publish All | Publish All | Dept Notices | Class Notices | None | View All | View All |
| **Support Helpdesk** | Full Triage | Full Triage | View Dept | Submit / View Own | Submit / View Own | Submit / View Own | Submit / View Own |
| **Advanced Reporting Center** | Full + CSV | Full + CSV | Dept + CSV | Class Reports | None | None | None |
| **Relational Reconciliation Hub** | Full | Full | None | None | None | None | None |
| **System Audit Logs** | Full View | None | None | None | None | None | None |
