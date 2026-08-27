# Institutional Compliance & Governance Guide

## Policy Repository & Version Control
- All institutional policies (`InstitutionalPolicy`) maintain immutable historical versions (`@@unique([policyCode, version])`).
- When a policy is updated, the previous version is marked as `ARCHIVED` and a new incremental version is published.
- Users can acknowledge policies (`PolicyAcknowledgement`), enabling administration to track policy compliance coverage across faculty, students, and staff.

## Compliance Checklists
- Categorized verification checks (`BACKUP`, `SECURITY`, `SAFETY`, `DATA_PROTECTION`, `AUDIT`).
- Configurable frequencies (`DAILY`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `ANNUAL`).
- Automated calculation of overdue items based on `dueDate`.
- Cryptographically verifiable sign-offs recording verifying user ID and timestamp.
