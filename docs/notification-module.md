# Notification & Communication Platform Module

## 1. Overview
The Notification & Communication Platform is a centralized institutional messaging system supporting:
- **In-App Notification Center**: User notification feed, unread counter badges, filtering by status (`ALL`, `UNREAD`, `READ`), and read status updates.
- **Institutional Notice Board**: Announcement creation with role-based audience targeting (`ALL`, `STUDENTS`, `FACULTY`, `NON_FACULTY`, `HODS`, `DEPARTMENT`, `CLASS`), category tagging (`GENERAL`, `ACADEMIC`, `HOLIDAY`, `EVENT`, `EMERGENCY`, `FEE`, `ATTENDANCE`), scheduling, auto-expiry, and mandatory read acknowledgments.
- **Official Meta WhatsApp Business API**: Direct integration via Graph API, template rendering with variable substitution, HMAC signature verification webhooks, and status tracking (`SENT`, `DELIVERED`, `READ`, `FAILED`).
- **Email & SMS Gateway Abstractions**: Real SMTP transactional email and SMS gateway handlers.
- **Async Message Queue Worker**: Non-blocking background worker queue with exponential backoff retries (max 3 retries).
- **Idempotency & Zero-Fake Guarantees**: Prevents duplicate notification broadcasts via idempotency keys and returns clear unconfigured errors (`WHATSAPP_NOT_CONFIGURED`) when external provider credentials are missing.

---

## 2. API Endpoints
### In-App Notifications (`/api/notifications`)
- `GET /api/notifications` — Fetch user in-app notification feed & unread counter.
- `PATCH /api/notifications/:id/read` — Mark notification as read.
- `POST /api/notifications/read-all` — Mark all user notifications as read.
- `DELETE /api/notifications/:id` — Delete notification item.

### Notice Board (`/api/notices`)
- `GET /api/notices` — Fetch active unexpired notices relevant to current user role and department/class.
- `GET /api/notices/recipient-estimate` — Estimate target recipient count before publishing mass notice.
- `POST /api/notices` — Publish or schedule new notice (role-restricted: Principal $\rightarrow$ ALL; HOD $\rightarrow$ Dept; Faculty $\rightarrow$ Class).
- `POST /api/notices/:id/acknowledge` — Log formal user read acknowledgment for mandatory notice.
- `POST /api/notices/process-scheduler` — Trigger background job for scheduled notice publishing and auto-expiry.

### Communication Platform (`/api/communication`)
- `GET /api/communication/templates` — List registered WhatsApp message templates and required variables.
- `POST /api/communication/whatsapp/send-template` — Send official Meta WhatsApp template message.
- `GET /api/communication/logs` — View delivery log audit trail across channels (WhatsApp, Email, SMS).
- `POST /api/communication/process-queue` — Trigger background message queue retry worker.
- `GET /api/communication/integrations/whatsapp/webhook` — Meta Webhook challenge verification.
- `POST /api/communication/integrations/whatsapp/webhook` — Meta Webhook status callback handler.
