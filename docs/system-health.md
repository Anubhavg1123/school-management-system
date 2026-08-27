# System Health & Diagnostic Runbook

## 1. Health Endpoints
- **Liveness Probe:** `GET /health` -> `{ status: "ok" }`
- **Readiness Probe:** `GET /health/ready` -> `{ status: "ok", db: true }`
- **Detailed Self-Diagnostics:** `GET /api/diagnostics/system-check` (Admin only)
- **Data Quality Auditor:** `GET /api/diagnostics/data-quality` (Admin only)

---

## 2. Evaluation Criteria

| Subsystem | Pass Condition | Warning Condition | Failure Condition |
|:---|:---|:---|:---|
| **Database Engine** | Query latency < 200ms | 200ms - 1000ms | Connection timed out / unreachable |
| **Node.js Heap Memory** | Used < 512MB | 512MB - 1GB | > 1GB memory exhaustion |
| **Backup Storage** | Archives present < 24h old | No archives found in `backups/` | Storage filesystem write error |
| **WhatsApp Provider** | Tokens present in `.env` | Provider unconfigured | Bad API response from Meta Cloud |
