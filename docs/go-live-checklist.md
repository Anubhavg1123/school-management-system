# Institutional Go-Live Readiness Checklist & Cutover Guide

## 1. Pre-Deployment Infrastructure Verification

- [x] **Database Connectivity & Migrations:** Prisma schema synced and verified with zero drift (`npx prisma db push`).
- [x] **Relational Schema Health:** Foreign keys, cascades, composite keys, and relational indexes verified across 45 models.
- [x] **Active Academic Year:** Designated current active academic year configured (`AcademicYear.isCurrent = true`).
- [x] **Master Organizational Hierarchy:** Departments, classes, sections, and subjects seeded with zero orphaned nodes.
- [x] **Security Posture & Secrets:**
  - Non-default `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` enforced (>= 32 chars).
  - Rate limiting active on authentication and sensitive administrative endpoints.
  - Helmet CSP, HSTS, X-Frame-Options: DENY headers enforced.
- [x] **Identity & Access Management (IAM):**
  - Minimum 1 active `SUPER_ADMIN` account verified.
  - Default administrative password hashes rotated.
  - TOTP MFA engine (RFC 6238) active.
- [x] **Automated Data Backup & Recovery:**
  - Automated SQLite/PostgreSQL backup script (`backend/scripts/db-backup.ts`) verified with SHA-256 integrity checksums.
  - Isolated database restore verification script tested.

---

## 2. External Integration Dependency Status

| Service / Dependency | In-Tree Status | Production Cutover Action | Fallback Behavior |
|:---|:---:|:---|:---|
| **WhatsApp Business API** | Implemented | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | In-app notification feed |
| **Email SMTP / SendGrid** | Implemented | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | In-app notification feed |
| **Payment Gateway** | Framework Ready | `PAYMENT_GATEWAY_KEY`, `PAYMENT_GATEWAY_SECRET` | Manual Bank / Cash / UPI receipts |
| **Biometric Attendance** | Real API Mappings | Deploy campus punch hardware | Manual Faculty & Attender Roll Call |

---

## 3. Production Deployment & Cutover Sequence

1. **Environment Provisioning:**
   - Configure production `.env` with strong randomized 64-character secrets.
   - Set `NODE_ENV=production` and configure dedicated domain `CORS_ORIGIN`.
2. **Database Initialization:**
   - Run `npx prisma db push` or apply production migrations.
   - Run initial master data seed: `npm run seed`.
3. **Data Ingestion (if migrating from legacy):**
   - Access `/principal/data-import` or `/office/data-import`.
   - Upload student and faculty rosters in CSV format.
   - Validate preview and confirm transactional ingestion.
4. **Verification & Probe Check:**
   - Verify `GET /health` -> 200 OK (`status: "UP"`).
   - Access `/principal/go-live` -> Verify all checks report **PASS**.
   - Perform test login, roll-call, payment, and support ticket creation.
