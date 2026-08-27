# Unified Approval Workflow Engine Architecture

## Overview
Phase 11 introduces a generalized multi-tier approval workflow architecture (`ApprovalWorkflowRule`, `GenericApprovalRequest`, `GenericApprovalHistory`) handling user registrations, admissions, faculty leaves, attendance bypasses, vehicle approvals, and refunds.

---

## 1. Workflow Schema & Rules
- **`ApprovalWorkflowRule`**: Configured by target role and step order (`stepOrder: 1` $\rightarrow$ `HOD`, `stepOrder: 2` $\rightarrow$ `SUPER_ADMIN`).
- **`GenericApprovalRequest`**: Multi-state queue (`PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `RETURNED_FOR_CORRECTION`).
- **`GenericApprovalHistory`**: Decision history log recording step order, action, reviewer user ID, role, and comments.

---

## 2. API Routes
- `GET /api/approvals/pending`: Fetches pending approval queue filtered by reviewer role and department context.
- `POST /api/approvals/request`: Initiates a new approval workflow request.
- `POST /api/approvals/:id/review`: Processes review decisions (`APPROVED`, `REJECTED`, `RETURNED_FOR_CORRECTION`) and triggers entity state transitions upon final step completion.
