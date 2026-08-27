# Staff Lifecycle & Responsibility Handover Guide

## Onboarding Process
- Profile verification and employee code assignment.
- Document and background verification logging (`StaffOnboardingChecklist`).
- IT asset allocation and email provisioning.

## Responsibility Handover Engine
When a faculty or staff member departs, `GET /api/lifecycle/staff/:userId/handover-check` automatically scans:
- **Class Assignments**: Active section coordinator allocations.
- **Timetable Slots**: Recurring lecture slots assigned to the faculty.
- **Pending Marks**: Examination papers awaiting marks verification or submission.
- **Assigned Assets**: Hardware, laptops, and departmental keys issued to the user.

Departing accounts are safely transitioned only after all responsibilities are reassigned.
