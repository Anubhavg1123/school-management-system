# Institutional Automation Guide

## 1. Automated Scheduled Jobs

| Job | Frequency | Purpose | Execution Hook |
|:---|:---|:---|:---|
| **Daily Data Quality Scan** | Nightly (02:00 AM) | Detects unassigned students and missing guardians | `DiagnosticsService.runDataQualityAudit()` |
| **Vehicle Document Expiry** | Daily (06:00 AM) | Detects insurance/fitness expiry < 30 days | `SmartCampusService.getVehicleDocumentAlerts()` |
| **System Diagnostics Probe** | Hourly | Tests DB latency, memory usage, backup freshness | `DiagnosticsService.runSystemDiagnostics()` |
| **Backup Snapshot Execution** | Daily (03:00 AM) | Exports database archive to `backups/` directory | `npm run db:backup` |

---

## 2. Smart Alert Thresholds

- **Low Attendance Warning:** Triggered when attendance drops below `75%`.
- **Fee Overdue Notice:** Triggered on the day after the configured due date.
- **Vehicle Expiry Notice:** Triggered at `30 days`, `15 days`, and `0 days` before expiry.
