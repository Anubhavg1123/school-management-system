import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Purging all demo, sample, and test records from database...');

  // Phase 17 Models
  await prisma.dataCorrectionRequest.deleteMany({});
  await prisma.institutionalIncident.deleteMany({});
  await prisma.operationalRecommendation.deleteMany({});
  await prisma.complianceChecklistItem.deleteMany({});
  await prisma.policyAcknowledgement.deleteMany({});
  await prisma.institutionalPolicy.deleteMany({});
  await prisma.institutionalFeedback.deleteMany({});
  await prisma.institutionalGrievance.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.assetMaintenanceLog.deleteMany({});
  await prisma.assetAssignmentHistory.deleteMany({});
  await prisma.institutionalAsset.deleteMany({});
  await prisma.staffExitHandover.deleteMany({});
  await prisma.staffOnboardingChecklist.deleteMany({});
  await prisma.alumniProfile.deleteMany({});
  await prisma.studentExitChecklist.deleteMany({});
  await prisma.parentTeacherMeetingBooking.deleteMany({});
  await prisma.parentTeacherMeetingSlot.deleteMany({});
  await prisma.eventRegistration.deleteMany({});
  await prisma.institutionalCalendarEvent.deleteMany({});
  await prisma.workflowSlaConfig.deleteMany({});
  await prisma.approvalDelegation.deleteMany({});

  // Phase 16 Models
  await prisma.studentCaseAction.deleteMany({});
  await prisma.studentCase.deleteMany({});
  await prisma.emergencyAlert.deleteMany({});
  await prisma.campusVehicleLog.deleteMany({});
  await prisma.visitorPreRegistration.deleteMany({});
  await prisma.campusStatusLog.deleteMany({});
  await prisma.configAuditLog.deleteMany({});
  await prisma.pushSubscription.deleteMany({});
  await prisma.dataImportRow.deleteMany({});
  await prisma.dataImportLog.deleteMany({});

  // Phase 15 & Support Models
  await prisma.supportTicketComment.deleteMany({});
  await prisma.supportTicket.deleteMany({});

  // Phase 12 Examinations & Results
  await prisma.studentResultSubjectDetail.deleteMany({});
  await prisma.studentResultSnapshot.deleteMany({});
  await prisma.studentMarks.deleteMany({});
  await prisma.examAttendance.deleteMany({});
  await prisma.examEligibility.deleteMany({});
  await prisma.examinationSubject.deleteMany({});
  await prisma.examinationClass.deleteMany({});
  await prisma.examination.deleteMany({});

  // Phase 13 & Assignments
  await prisma.assignmentTarget.deleteMany({});
  await prisma.assignmentAttachment.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.classAnnouncement.deleteMany({});
  await prisma.studentProfileUpdateRequest.deleteMany({});
  await prisma.studentLeaveRequest.deleteMany({});

  // Phase 6 Attendance & Bypass
  await prisma.academicBypassRequest.deleteMany({});
  await prisma.studentAttendanceCorrection.deleteMany({});
  await prisma.studentAttendance.deleteMany({});
  await prisma.attendanceSlot.deleteMany({});
  await prisma.attendanceCorrection.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.attendanceAnomaly.deleteMany({});

  // Phase 4 Financials & Fees
  await prisma.refund.deleteMany({});
  await prisma.receipt.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.feeInstallment.deleteMany({});
  await prisma.studentFeeItem.deleteMany({});
  await prisma.feeDiscount.deleteMany({});
  await prisma.studentFeeAssignment.deleteMany({});
  await prisma.feeStructureItem.deleteMany({});
  await prisma.feeStructure.deleteMany({});

  // Phase 3 & 5 Academic & Student Records
  await prisma.studentDocument.deleteMany({});
  await prisma.studentTransferLog.deleteMany({});
  await prisma.guardianStudentRelationship.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.student.deleteMany({});

  await prisma.substituteFacultyAssignment.deleteMany({});
  await prisma.extraClassRequest.deleteMany({});
  await prisma.timetableEntry.deleteMany({});
  await prisma.facultyAvailability.deleteMany({});
  await prisma.facultySubjectAssignment.deleteMany({});
  await prisma.classCoordinatorHistory.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.classSubject.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.timeSlot.deleteMany({});
  await prisma.subject.deleteMany({});

  // Phase 7, 8, 9 Faculty & Non-Faculty
  await prisma.facultyVehicleRegistration.deleteMany({});
  await prisma.facultyLeave.deleteMany({});
  await prisma.departmentHodHistory.deleteMany({});
  await prisma.faculty.deleteMany({});

  await prisma.vehicleKmLog.deleteMany({});
  await prisma.fuelRecord.deleteMany({});
  await prisma.vehicleMaintenance.deleteMany({});
  await prisma.vehicleAssignmentHistory.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.nonFacultyStaff.deleteMany({});

  await prisma.visitorEntryExit.deleteMany({});
  await prisma.visitor.deleteMany({});

  await prisma.departmentNotice.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationEvent.deleteMany({});
  await prisma.genericApprovalRequest.deleteMany({});

  await prisma.department.deleteMany({});
  await prisma.academicYear.deleteMany({});

  // Audit Logs & Refresh Tokens
  await prisma.auditLog.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.registrationRequest.deleteMany({});

  // Clean Users except the Super Admin
  const adminUser = await prisma.user.findFirst({
    where: {
      email: 'principal@school.edu',
    },
  });

  if (adminUser) {
    await prisma.userRole.deleteMany({
      where: {
        userId: { not: adminUser.id },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { not: adminUser.id },
      },
    });
  } else {
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
  }

  console.log('✅ Clean database purge completed successfully. System is in 100% clean production state.');
}

cleanDatabase()
  .catch((e) => {
    console.error('❌ Clean database error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
