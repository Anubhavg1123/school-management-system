# Security Incident Response Plan

## 1. Incident Handling Framework (6 Stages)

1. **Detection & Triage**:
   - Automated triggers: Spike in 401/403 authorization failures, multiple failed logins from single IP, rate limit triggers.
   - Initial classification: Low / Medium / High / Critical.

2. **Containment**:
   - Compromised accounts: Transition User status to `SUSPENDED` or lock account. Revoke all active refresh tokens via `/api/auth/logout-all`.
   - Malicious IP addresses: Block IP at reverse proxy / firewall level.

3. **Investigation & Analysis**:
   - Correlate events using `x-request-id` in structured logs.
   - Inspect `AuditLog` table for affected user records, modified permissions, or unauthorized data exports.

4. **Eradication**:
   - Force credential resets for affected accounts.
   - Invalidate compromised JWT signing secrets if secret exposure occurred.

5. **Recovery**:
   - Restore database snapshot if unauthorized data alteration took place.
   - Verify integrity using `npx ts-node scripts/data-integrity-check.ts`.

6. **Post-Mortem & Reporting**:
   - Document root cause analysis (RCA), timeline of events, remediation steps, and preventative safeguards.
