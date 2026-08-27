# Operational Known Issues, Constraints & External Integrations

## 1. External Integration Constraints

| Component | Status | Operational Impact | Mitigation / Remedy |
|:---|:---:|:---|:---|
| **WhatsApp Meta WABA** | Unconfigured in Dev | Outbound WhatsApp template messages log a warning but do not fail parent notification flows. | Enter Meta App ID, Token, and Phone Number ID in production environment. In-app notifications deliver immediately regardless. |
| **Outbound Email (SMTP)** | Unconfigured in Dev | Direct SMTP password reset emails are held in queue. | Configure SendGrid API Key or SMTP credentials in `.env`. |
| **Payment Gateway Webhooks** | Simulated / Cash-First | Online automated gateway payments require production merchant keys (Razorpay/Stripe). | Institutional fee receipts, cash payments, UPI references, and manual ledger reconciliations operate natively. |

---

## 2. Platform Constraints & Architectural Boundaries

1. **SQLite Database Driver:**
   - Default local development uses SQLite (`dev.db`). For concurrent write loads exceeding 100 req/sec, migrate datasource to PostgreSQL (`DATABASE_URL="postgresql://user:pass@host:5432/sms_db"`).
2. **Biometric Hardware Integration:**
   - Physical RFID/biometric turnstile gates require local TCP/IP webhook bridges communicating with `/api/attendance` and `/api/visitor-security/visitors`.
3. **Frontend Bundle Size Optimization:**
   - Vite minification emits chunk advisory for single 800kB bundle. Recommended for high-latency mobile networks: enable dynamic `React.lazy()` imports for sub-portal routes.
