# Financial & Student Fee Management Architecture

## 1. Overview
The Financial and Student Fee Management module provides institutional billing, fee structure customization, student fee allocation, installment schedules, multi-channel payment collection, receipt issuing, refund logging, and scholarship concessions for the School Management System.

All operations are backed by a normalized relational database engine (Prisma ORM with SQLite in development and PostgreSQL in production) with ACID transactions, strict idempotency controls, and role-based access control (RBAC).

---

## 2. Core Entities & Schema Architecture

The financial domain consists of 10 interconnected tables:

1. **`FeeCategory`**: Configurable categories of fees (Tuition, Admission, Exam, Lab, Library, Transport, Sports, Activity, Other).
2. **`FeeStructure`**: Master templates bound to an Academic Year and optional Class/Department.
3. **`FeeStructureItem`**: Itemized breakdown linking a category, amount, and number of default installments.
4. **`StudentFeeAssignment`**: Individual student billing record tracking total assigned, discounts, payments, refunds, and net payable.
5. **`StudentFeeItem`**: Student-level itemization recording category amounts and specific discounts.
6. **`FeeInstallment`**: Chronological installment schedule with due dates, amounts, paid portions, and status (`UPCOMING`, `DUE`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`).
7. **`FeeDiscount`**: Approved scholarship, merit concession, sibling discount, or administrative waiver.
8. **`Payment`**: Transaction record capturing payment method (`CASH`, `UPI`, `BANK_TRANSFER`, `ONLINE`, `CHEQUE`), unique transaction reference, amount, and cashier notes.
9. **`Receipt`**: Official, immutable receipt document (`RCP-YYYY-XXXX`) generated immediately upon successful payment.
10. **`Refund`**: Audit-backed repayment record (`REF-YYYY-XXXX`) linked to the original payment, adjusting student ledger balances.

---

## 3. Financial Invariants & Business Logic

### Idempotent Payments & Duplicate Reference Protection
- `Payment.transactionReference` is globally unique in the database.
- Any attempt to reuse a reference number (e.g. UPI txn hash or bank wire ID) results in an immediate `409 CONFLICT` with error code `DUPLICATE_TRANSACTION_REF`.
- No mock payments or fake gateway responses: every recorded transaction is verified and saved to the relational database.

### Automated Installment Allocation
When a student pays an arbitrary amount:
1. The backend fetches active installments ordered by `installmentNumber` ascending.
2. The payment amount cascades across pending installments from earliest due to latest.
3. Once an installment is fully settled, its status is marked `PAID`. Partial settlements mark the installment `PARTIALLY_PAID`.
4. Overdue status is evaluated dynamically: `installment.dueDate < now && installment.paidAmount < installment.amount`.

### Scholarships, Waivers, and Concessions
- Discounts can be applied as either a fixed dollar amount or a percentage of the total fee.
- Applying a discount decreases `StudentFeeAssignment.totalDiscountAmount`, recalculates `netPayableAmount`, and proportionately reduces the unpaid installment balances starting from the latest installment.

### Refunds & Payment Reversals
- Refunds cannot exceed the net settled amount of the payment (`payment.amount - sum(existingRefunds)`).
- Processing a refund creates an immutable `Refund` record with `REF-YYYY-XXXX` identifier.
- The corresponding `Payment.status` transitions to `REFUNDED` or `PARTIALLY_REFUNDED`.
- The refunded sum is added back to `StudentFeeAssignment.totalRefundedAmount` and reopens previously settled installments chronologically backwards.

---

## 4. RBAC & Security Isolation

Strict role-based access control is enforced at the route level:

| Role | Access Level | Permissions |
| :--- | :--- | :--- |
| **Principal (`SUPER_ADMIN`)** | Full Access | View Dashboard, Manage Structures, Assign Fees, Collect Payments, Apply Discounts, Issue Refunds, Export CSV |
| **Office Admin (`OFFICE_ADMIN`)** | Financial Operations | View Dashboard, Manage Structures, Assign Fees, Collect Payments, Apply Discounts, Issue Refunds, Export CSV |
| **HOD (`HOD`)** | **Strictly Forbidden (403)** | No access to fees API or financial reports |
| **Faculty (`FACULTY`)** | **Strictly Forbidden (403)** | No access to fees API or financial reports |
| **Non-Faculty (`NON_FACULTY`)** | **Strictly Forbidden (403)** | No access to fees API or financial reports |
| **Student / Parent** | Read Own Profile Only | View personal student fee profile and receipt history |

---

## 5. API Reference

All endpoints are mounted under `/api/fees`:

- `GET /api/fees/categories` — List all fee categories.
- `POST /api/fees/categories` — Create fee category.
- `GET /api/fees/structures` — List fee structures with items.
- `POST /api/fees/structures` — Create itemized fee structure.
- `POST /api/fees/assign` — Assign fee structure to student.
- `GET /api/fees/assignments` — Query student fee assignments.
- `POST /api/fees/discount` — Apply scholarship, waiver, or concession.
- `POST /api/fees/pay` — Collect fee payment and issue receipt.
- `POST /api/fees/refund` — Issue partial/full refund against a payment.
- `GET /api/fees/student/:studentId` — Full financial ledger for student.
- `GET /api/fees/dashboard` — Executive KPI summary.
- `GET /api/fees/reports/outstanding` — Query outstanding fees (supports `?format=csv`).
