# Production Deployment 30-Point Checklist

| No | Category | Item Description | Verification Status |
| :--- | :--- | :--- | :---: |
| 1 | **Environment** | `NODE_ENV` set to `production` | [ ] Required |
| 2 | **Environment** | `JWT_ACCESS_SECRET` changed from development default | [ ] Required |
| 3 | **Environment** | `JWT_REFRESH_SECRET` changed from development default | [ ] Required |
| 4 | **Database** | Database URL pointing to production database with least privilege | [ ] Required |
| 5 | **Database** | Prisma migrations applied cleanly (`prisma migrate deploy`) | [ ] Required |
| 6 | **Database** | Automated daily backup cron job configured | [ ] Required |
| 7 | **Database** | Backup restore verification tested and verified | [ ] Required |
| 8 | **Security** | HTTPS / TLS Certificate configured on load balancer / reverse proxy | [ ] Required |
| 9 | **Security** | CORS origin restricted to institutional frontend domain | [ ] Required |
| 10 | **Security** | HTTP Security Headers (Helmet CSP, HSTS, X-Frame-Options) active | [ ] Required |
| 11 | **Security** | IP Rate Limiting enabled on `/api/auth/*` and sensitive endpoints | [ ] Required |
| 12 | **Security** | Account lockout active after 5 failed login attempts (15 min) | [ ] Required |
| 13 | **Security** | MFA / TOTP configured for administrative and executive roles | [ ] Required |
| 14 | **Security** | Server-side authorization enforced on all controller layers | [ ] Required |
| 15 | **Security** | IDOR testing verified across student, guardian, marks, fees | [ ] Required |
| 16 | **Logging** | Structured logging active with `x-request-id` header tracking | [ ] Required |
| 17 | **Monitoring** | `/health`, `/ready`, `/live` endpoints monitored by load balancer | [ ] Required |
| 18 | **Monitoring** | Error rate and latency alerts configured | [ ] Required |
| 19 | **Communication** | Official WhatsApp Business API tokens and Webhook secret configured | [ ] Required |
| 20 | **Communication** | Zero fake/simulated delivery confirmed in production paths | [ ] Required |
| 21 | **Finance** | Payment transaction references enforced as unique | [ ] Required |
| 22 | **Finance** | Duplicate payment prevention and idempotency active | [ ] Required |
| 23 | **Examinations** | Immutable result snapshot versioning (`v1`, `v2`) active | [ ] Required |
| 24 | **Examinations** | Unverified / Draft results hidden from students & parents | [ ] Required |
| 25 | **Portals** | Student & Guardian portals strictly isolated by server ownership | [ ] Required |
| 26 | **Build** | Frontend Vite production bundle built without errors (`npm run build`) | [ ] Required |
| 27 | **Build** | Backend TypeScript compilation passed without errors (`npm run build`) | [ ] Required |
| 28 | **Testing** | 100% automated integration test suite pass rate verified | [ ] Required |
| 29 | **Disaster Recovery** | Disaster Recovery plan documented with RPO $\le 1$h, RTO $\le 15$m | [ ] Required |
| 30 | **Data Integrity** | Initial data integrity audit executed with 0 critical anomalies | [ ] Required |
