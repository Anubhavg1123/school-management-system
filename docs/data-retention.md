# Data Retention, Archival & Immutability Policy

## 1. Statutory Retention Requirements
- **Academic Results & Marksheets:** Permanent retention (Cannot be purged).
- **Fee Ledger & Payment Receipts:** 7-Year financial audit retention.
- **Student Admissions & Transfer History:** Permanent institutional record.
- **Audit Logs (`AuditLog` / `ConfigAuditLog`):** Append-only immutable log (10 years retention).

---

## 2. Ephemeral Data Lifecycle
- **Notification Event Logs:** 90-day active retention -> Archived.
- **Visitor Entry/Exit Passes:** 1-year security retention -> Archived.
- **Temporary Uploads:** Cleaned after successful batch ingestion.
