# Final Operations & Administrator Runbook

## 1. System Topology & Launch
- **Backend API Server:** Node.js Express TypeScript on port `5000` (or `PORT` env).
- **Frontend SPA / PWA:** Vite React SPA with PWA manifest and service worker on port `5173`.
- **Database Engine:** SQLite `prisma/dev.db` (local dev/staging) or PostgreSQL via Prisma ORM.

---

## 2. Daily Operational Checklist
1. **Morning (07:30 AM):** Security officers log on to `/staff/security-view` for gate intake.
2. **Class Hours (09:00 AM - 04:00 PM):** Faculty record period-level attendance on `/faculty/roll-call`.
3. **Midday (01:00 PM):** Office staff verify fee collections on `/office/fees` and support tickets on `/office/support`.
4. **Evening (05:00 PM):** HODs review marks on `/examinations/verification`.
5. **Nightly (02:00 AM):** Automated database backup snapshot generated.

---

## 3. Emergency Response Procedure
1. Navigate to `/principal/emergency`.
2. Select **Campus Status: EMERGENCY**.
3. Draft alert title and message.
4. Select target audience and click **Broadcast Emergency Alert**.
5. Alert banner instantly appears on all active user devices via SSE.
