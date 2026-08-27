# Communication & Audience Security Rules

## 1. Audience Target Scope Enforcement
To prevent unauthorized mass messaging and security breaches, notice creation is strictly scoped by role:
- **SUPER_ADMIN & OFFICE_ADMIN**: Can target `ALL`, `STUDENTS`, `FACULTY`, `NON_FACULTY`, `HODS`, `DEPARTMENT`, `CLASS`, and issue `EMERGENCY` notices.
- **HOD**: Can target `DEPARTMENT`, `FACULTY`, `DEPARTMENT_STUDENT`, `CLASS` within their assigned department only. Rejects institution-wide (`ALL`) notice requests with `403 Forbidden`.
- **FACULTY**: Can target assigned classes/sections only. Rejects institution-wide or cross-department notice requests with `403 Forbidden`.

## 2. Webhook Signature Verification
- Webhook endpoints require HMAC SHA256 signature validation matching `WHATSAPP_WEBHOOK_SECRET`.
- Unsigned or invalid payload attempts are rejected with `401 Unauthorized`.

## 3. Idempotency Control
- Every notification dispatch request accepts an optional `idempotencyKey`.
- Duplicate dispatches sharing the same key are safely ignored without sending duplicate messages to parents or students.
