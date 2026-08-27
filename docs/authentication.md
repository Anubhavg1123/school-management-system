# Authentication & Identity Architecture

## 1. Security Principles

1. **Dual-Token Session Model**:
   - **Access Token (JWT)**: Short-lived (15 minutes), holds user ID, verified roles, active role, and department scope. Verified statelessly in memory.
   - **Refresh Token**: Long-lived (7 days), hashed with SHA-256 and stored in the database. Token rotation is enforced on every refresh, revoking previous refresh tokens.
2. **Password Cryptography**:
   - Hashed using **Bcrypt** with salt rounds set to 12.
   - Policy: Minimum 8 characters, containing uppercase, lowercase, numbers, and special characters.
3. **Account Lockout & Brute-Force Defense**:
   - Failed login attempts are incremented on each incorrect password.
   - At 5 consecutive failures, the account transitions to `LOCKED` with a 15-minute expiration lockout window (`lockoutUntil = now() + 15m`).
   - Every failed attempt and lockout event is recorded in the audit trail.
4. **Role Spoofing Prevention**:
   - During login, users may specify an intended `selectedRole`.
   - The backend strictly queries the user's assigned roles in the database.
   - If the user attempts to assume a role not assigned to them, the server rejects the request with `403 Forbidden` (`ROLE_NOT_ASSIGNED`) and logs a security alert.

---

## 2. User Lifecycle States

```
[Public Registration Request]
          │
          ▼
   PENDING_APPROVAL ───(Rejection)───► INACTIVE / REJECTED
          │
      (Approval)
          │
          ▼
        ACTIVE ◄────► LOCKED (Automatic lockout upon 5 failed logins)
          │
          ▼
      SUSPENDED (Administrative action)
```
