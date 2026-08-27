# Normalized Database Architecture & Entity Specifications (Phase 3)

## 1. Schema Summary

The database uses a normalized relational schema managed with Prisma ORM.

---

## 2. Core Entities

### `User`
- `id`: Primary Key (CUID)
- `email`: String (Unique, Indexed)
- `username`: String (Unique, Indexed)
- `passwordHash`: String (Bcrypt salt rounds = 12)
- `firstName`: String
- `lastName`: String
- `phone`: String?
- `whatsAppNumber`: String? (Mandatory on registration and admission)
- `altPhone`: String?
- `dob`: DateTime?
- `gender`: String? (`MALE`, `FEMALE`, `OTHER`)
- `address`: String?
- `emergencyContactName`: String?
- `emergencyContactPhone`: String?
- `userCategory`: String? (`TEACHING_STAFF`, `NON_TEACHING_STAFF`, `ADMINISTRATIVE`, `STUDENT`, `OTHER`)
- `idProofType`: String?
- `idProofNumber`: String?
- `status`: String (`PENDING_APPROVAL`, `ACTIVE`, `INACTIVE`, `SUSPENDED`, `LOCKED`)
- `failedLoginAttempts`: Integer
- `lockoutUntil`: DateTime?
- `lastLoginAt`: DateTime?
- `createdAt`, `updatedAt`, `deletedAt`

### `Student`
- `id`: Primary Key (CUID)
- `userId`: String (Unique, FK to User)
- `admissionNumber`: String (Unique, Indexed, e.g. `ADM-2026-0001`)
- `enrollmentNumber`: String? (Unique, Indexed, e.g. `ENR-2026-0001`)
- `rollNumber`: String?
- `academicYearId`: String? (FK to AcademicYear)
- `departmentId`: String? (FK to Department, optional for general K-10, required for collegiate/department-specific)
- `sectionId`: String? (FK to Section)
- `admissionDate`: DateTime (Default: now)
- `dateOfBirth`: DateTime?
- `gender`: String?
- `bloodGroup`: String?
- `emergencyContact`: String?
- `previousSchool`: String?
- `previousGrade`: String?
- `previousScore`: String?
- `photoUrl`: String?
- `status`: String (`ACTIVE`, `INACTIVE`, `TRANSFERRED`, `LEFT_INSTITUTION`, `GRADUATED`, `SUSPENDED`)
- `createdAt`, `updatedAt`

### `StudentTransferLog`
- `id`: Primary Key (CUID)
- `studentId`: String (FK to Student)
- `fromAcademicYearId`: String?
- `toAcademicYearId`: String?
- `fromDepartmentId`: String?
- `toDepartmentId`: String?
- `fromClassId`: String?
- `toClassId`: String?
- `fromSectionId`: String?
- `toSectionId`: String?
- `fromStatus`: String?
- `toStatus`: String?
- `transferType`: String (`CLASS_TRANSFER`, `SECTION_TRANSFER`, `PROMOTION`, `STATUS_CHANGE`, `DEPT_TRANSFER`)
- `reason`: String
- `effectiveDate`: DateTime (Default: now)
- `transferredByUserId`: String?
- `createdAt`: DateTime (Default: now)

### `StudentDocument`
- `id`: Primary Key (CUID)
- `studentId`: String (FK to Student)
- `docType`: String (`PHOTO`, `BIRTH_CERTIFICATE`, `PREVIOUS_MARKSHEET`, `ID_PROOF`, `TRANSFER_CERTIFICATE`, `MEDICAL_RECORD`, `OTHER`)
- `title`: String
- `fileUrl`: String
- `fileSize`: Int?
- `mimeType`: String?
- `uploadedByUserId`: String?
- `createdAt`: DateTime (Default: now)

### `Guardian`
- `id`: Primary Key (CUID)
- `studentId`: String (FK to Student)
- `fullName`: String
- `relationship`: String (`FATHER`, `MOTHER`, `LEGAL_GUARDIAN`)
- `phone`: String
- `email`: String?
- `occupation`: String?
- `address`: String?
- `isPrimary`: Boolean (Default: true)
- `createdAt`: DateTime

### `Department`, `AcademicYear`, `Class`, `Section`
- Structural hierarchies with HOD assignment and departmental scoping.

---

## 3. Financial & Fee Management Entities (Phase 4)

### `FeeCategory`
- `id`: Primary Key (CUID)
- `code`: String (Unique, e.g. `TUITION`, `LAB`, `LIBRARY`, `TRANSPORT`, `SPORTS`, `ACTIVITY`, `OTHER`)
- `name`: String
- `description`: String?
- `status`: String (Default: `ACTIVE`)
- `createdAt`, `updatedAt`

### `FeeStructure` & `FeeStructureItem`
- `id`: Primary Key (CUID)
- `code`: String (Unique, e.g. `FS-2026-001`)
- `name`: String
- `academicYearId`: String (FK to AcademicYear)
- `classId`: String? (FK to Class)
- `departmentId`: String? (FK to Department)
- `description`: String?
- `status`: String (Default: `ACTIVE`)
- **Items (`FeeStructureItem`)**:
  * `id`: Primary Key (CUID)
  * `feeStructureId`: String (FK to FeeStructure)
  * `feeCategoryId`: String (FK to FeeCategory)
  * `amount`: Float
  * `isOptional`: Boolean (Default: false)
  * `dueDate`: DateTime?
  * `installmentCount`: Int (Default: 1)

### `StudentFeeAssignment` & `StudentFeeItem`
- `id`: Primary Key (CUID)
- `studentId`: String (FK to Student)
- `feeStructureId`: String (FK to FeeStructure)
- `academicYearId`: String (FK to AcademicYear)
- `totalAssignedAmount`: Float
- `totalDiscountAmount`: Float (Default: 0)
- `totalPaidAmount`: Float (Default: 0)
- `totalRefundedAmount`: Float (Default: 0)
- `netPayableAmount`: Float
- `status`: String (`UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`)
- `assignedAt`: DateTime (Default: now)
- `assignedByUserId`: String?
- `notes`: String?
- **Items (`StudentFeeItem`)**:
  * `id`: Primary Key (CUID)
  * `feeAssignmentId`: String (FK to StudentFeeAssignment)
  * `feeCategoryId`: String (FK to FeeCategory)
  * `originalAmount`, `discountAmount`, `netAmount`, `paidAmount`: Float
  * `status`: String (Default: `UNPAID`)

### `FeeInstallment`
- `id`: Primary Key (CUID)
- `feeAssignmentId`: String (FK to StudentFeeAssignment)
- `installmentNumber`: Int
- `name`: String (e.g. "Term 1 Installment")
- `amount`: Float
- `dueDate`: DateTime
- `paidAmount`: Float (Default: 0)
- `status`: String (`UPCOMING`, `DUE`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`)

### `FeeDiscount`
- `id`: Primary Key (CUID)
- `feeAssignmentId`: String (FK to StudentFeeAssignment)
- `studentId`: String (FK to Student)
- `type`: String (`FIXED_AMOUNT`, `PERCENTAGE`, `SCHOLARSHIP`, `CONCESSION`, `WAIVER`)
- `amount`: Float
- `percentage`: Float?
- `reason`: String (Mandatory justification)
- `status`: String (Default: `ACTIVE`)
- `approvedByUserId`: String?
- `createdAt`: DateTime (Default: now)

### `Payment`
- `id`: Primary Key (CUID)
- `paymentNumber`: String (Unique, e.g. `PAY-2026-0001`)
- `studentId`: String (FK to Student)
- `feeAssignmentId`: String (FK to StudentFeeAssignment)
- `academicYearId`: String (FK to AcademicYear)
- `amount`: Float
- `paymentDate`: DateTime (Default: now)
- `paymentMethod`: String (`CASH`, `UPI`, `BANK_TRANSFER`, `ONLINE`, `CHEQUE`, `OTHER`)
- `transactionReference`: String? (Unique idempotency constraint)
- `status`: String (`SUCCESS`, `PENDING`, `FAILED`, `CANCELLED`, `REFUNDED`, `PARTIALLY_REFUNDED`)
- `receivedByUserId`: String?
- `notes`: String?

### `Receipt`
- `id`: Primary Key (CUID)
- `receiptNumber`: String (Unique, e.g. `RCP-2026-0001`)
- `paymentId`: String (Unique, FK to Payment)
- `studentId`: String (FK to Student)
- `amountPaid`: Float
- `totalAssigned`: Float
- `totalRemainingBalance`: Float
- `issuedDate`: DateTime (Default: now)
- `issuedByUserId`: String?
- `notes`: String?

### `Refund`
- `id`: Primary Key (CUID)
- `refundNumber`: String (Unique, e.g. `REF-2026-0001`)
- `paymentId`: String (FK to Payment)
- `studentId`: String (FK to Student)
- `amount`: Float
- `reason`: String (Mandatory justification)
- `status`: String (Default: `PROCESSED`)
- `requestedByUserId`: String?
- `approvedByUserId`: String?
- `refundDate`: DateTime (Default: now)
- `createdAt`: DateTime (Default: now)

