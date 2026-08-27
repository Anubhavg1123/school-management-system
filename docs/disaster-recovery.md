# Disaster Recovery & Continuity Plan

## 1. Objectives & Metrics
- **Recovery Point Objective (RPO)**: $\le 1$ hour (Maximum acceptable data loss window during critical failures).
- **Recovery Time Objective (RTO)**: $\le 15$ minutes (Maximum acceptable downtime before application service is restored).

---

## 2. Failure Scenarios & Standard Runbooks

### Scenario A: Database File Corruption or Hardware Crash
1. Stop backend service: `npm run stop` or container stop.
2. Locate the most recent valid backup in `backend/backups/` or offsite cloud storage.
3. Validate checksum: `sha256sum -c school-db-backup-<timestamp>.db.sha256`.
4. Restore database file: `cp school-db-backup-<timestamp>.db prisma/dev.db`.
5. Run restore verification check: `npx ts-node scripts/db-restore-test.ts`.
6. Restart backend service and verify `/health` endpoint returns `200 OK`.

### Scenario B: Application Process Crash or Unhandled Exception
1. Process manager (PM2 / Systemd / Kubernetes) automatically restarts the Node.js process.
2. Liveness check at `/live` alerts on failure if restart fails within 3 attempts.
3. Inspect structured logs for request correlation ID: `grep "x-request-id" /var/log/school-app.log`.

### Scenario C: WhatsApp API or External Notification Provider Outage
1. System logs failed delivery in `NotificationDelivery` with status `FAILED` and provider error message.
2. Background queue worker holds undelivered messages for exponential backoff retries (up to 3 attempts).
3. Fallback alerts switch to in-app notification inbox automatically.
