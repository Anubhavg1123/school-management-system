# Feature Flags & Configuration Management

## 1. Supported Feature Flags

| Flag Key | Module Category | Default State | Description |
|:---|:---|:---:|:---|
| `ONLINE_PAYMENTS` | PAYMENTS | `ENABLED` | Enables payment gateway checkout integration for fees |
| `WHATSAPP_NOTIFICATIONS` | COMMUNICATION | `ENABLED` | Enables Meta WhatsApp Cloud API template notifications |
| `AI_INSIGHTS` | AI | `ENABLED` | Enables natural language queries and explainable insights |
| `EMERGENCY_BROADCASTS` | SECURITY | `ENABLED` | Enables instant emergency alert broadcasts and banner display |
| `PWA_OFFLINE` | GENERAL | `ENABLED` | Enables service worker shell caching and install prompt |
| `VISITOR_PRE_REGISTRATION` | SECURITY | `ENABLED` | Enables staff guest pre-registration |

---

## 2. Configuration Audit Log
Whenever a flag or system parameter is updated:
- The previous value (`oldValue`) and new value (`newValue`) are recorded in `ConfigAuditLog`.
- The user ID and explicit reason for change are permanently stored.
