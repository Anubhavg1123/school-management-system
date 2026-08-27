# AI Security, Privacy & Guardrail Architecture

## 1. Core Principles
1. **Read-Only by Default:** The AI and natural-language query engine cannot mutate database records, alter attendance, publish marks, or delete records.
2. **Deterministic RBAC Scoping:** All queries are filtered by user role and departmental permissions before database access.
3. **Zero Secret / PII Leakage:** Passwords, refresh tokens, credentials, and biometric records are explicitly excluded from all query select projections.
4. **Explainable Mathematics:** All automated insights provide the exact mathematical formula, data period, and underlying database source.

---

## 2. Prompt Injection Defense
The system implements regex-based sanitization and query intent parsing. The following patterns are rejected with `400 Bad Request (SECURITY_PROMPT_INJECTION_REJECTED)`:
- `ignore previous instructions`
- `bypass permissions`
- `show all passwords`
- `drop table`
- `grant admin`
- `reveal secrets`

---

## 3. Human-in-the-Loop Workflow
For automated communication drafting (`POST /api/ai/draft-notice`):
- The assistant generates structured drafts marked with `status: 'REQUIRES_HUMAN_APPROVAL'`.
- No notification is dispatched automatically without an authorized administrator reviewing, editing, and confirming the broadcast.
