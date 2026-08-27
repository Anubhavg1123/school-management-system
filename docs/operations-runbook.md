# Operational Runbook & Maintenance Guide

## 1. Routine Maintenance Tasks

### Daily Tasks
- Verify `/health` and `/ready` endpoints.
- Execute automated database backup: `npx ts-node scripts/db-backup.ts`.
- Run database restore test to ensure backup validity: `npx ts-node scripts/db-restore-test.ts`.

### Weekly Tasks
- Run data integrity check: `npx ts-node scripts/data-integrity-check.ts`.
- Review Audit Logs for anomalous privilege escalations or failed login clusters.
- Review error log rate and latency statistics.

---

## 2. Emergency Operations

### Graceful Application Restart
```bash
# PM2 process restart
pm2 restart school-management-backend

# Systemd service restart
sudo systemctl restart school-management.service
```

### Checking Application Health
```bash
curl -i http://localhost:5000/health
curl -i http://localhost:5000/ready
curl -i http://localhost:5000/live
```
