# Student Lifecycle & Alumni Management Guide

## Student State Machine
```mermaid
stateDiagram-v2
    [*] --> APPLICANT: Registration Submission
    APPLICANT --> ACTIVE: Administrative Admission Approval
    ACTIVE --> SUSPENDED: Disciplinary Action
    SUSPENDED --> ACTIVE: Reinstatement
    ACTIVE --> EXIT_CLEARANCE: Graduation / Withdrawal Initiation
    EXIT_CLEARANCE --> GRADUATED: Full Clearance Approved
    EXIT_CLEARANCE --> LEFT_INSTITUTION: Withdrawal Finalized
    GRADUATED --> ALUMNI: Alumni Profile Generated
```

## Exit Clearance Requirements
Before updating a student's status to `LEFT_INSTITUTION` or `GRADUATED`, the system requires verification of:
1. **Fee Clearance**: Zero outstanding tuition or hostel dues.
2. **Library Clearance**: All issued volumes returned or reconciled.
3. **Asset Clearance**: Laboratory equipment or sports gear returned.
4. **Document Clearance**: Transfer certificates and academic transcripts issued.
5. **ID Card Surrender**: Physical identification returned.
