import { prisma } from '../src/prisma';

export interface IntegrityReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  issuesFound: Array<{
    category: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    count: number;
  }>;
}

export const runDataIntegrityCheck = async (): Promise<IntegrityReport> => {
  const issues: IntegrityReport['issuesFound'] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  // 1. Check for Students with missing User link
  totalChecks++;
  const orphanStudents: any[] = await prisma.$queryRaw`
    SELECT s.id FROM Student s
    LEFT JOIN User u ON s.userId = u.id
    WHERE u.id IS NULL
  `;
  if (orphanStudents.length > 0) {
    issues.push({
      category: 'STUDENTS',
      severity: 'CRITICAL',
      description: 'Student records found without associated User accounts.',
      count: orphanStudents.length,
    });
  } else {
    passedChecks++;
  }

  // 2. Check for Inconsistent User Roles (UserRoles without valid User or Role)
  totalChecks++;
  const orphanUserRoles: any[] = await prisma.$queryRaw`
    SELECT ur.id FROM UserRole ur
    LEFT JOIN User u ON ur.userId = u.id
    LEFT JOIN Role r ON ur.roleId = r.id
    WHERE u.id IS NULL OR r.id IS NULL
  `;
  if (orphanUserRoles.length > 0) {
    issues.push({
      category: 'AUTH_RBAC',
      severity: 'HIGH',
      description: 'UserRole records found with unlinked User or Role.',
      count: orphanUserRoles.length,
    });
  } else {
    passedChecks++;
  }

  // 3. Check for Payments with unlinked Student Fee Assignment
  totalChecks++;
  const orphanPayments: any[] = await prisma.$queryRaw`
    SELECT p.id FROM Payment p
    LEFT JOIN StudentFeeAssignment a ON p.feeAssignmentId = a.id
    WHERE p.feeAssignmentId IS NOT NULL AND a.id IS NULL
  `;
  if (orphanPayments.length > 0) {
    issues.push({
      category: 'FINANCE',
      severity: 'HIGH',
      description: 'Payment transactions found without valid StudentFeeAssignment.',
      count: orphanPayments.length,
    });
  } else {
    passedChecks++;
  }

  // 4. Check for Student Attendance records without valid Student
  totalChecks++;
  const orphanAttendance: any[] = await prisma.$queryRaw`
    SELECT a.id FROM StudentAttendance a
    LEFT JOIN Student s ON a.studentId = s.id
    WHERE s.id IS NULL
  `;
  if (orphanAttendance.length > 0) {
    issues.push({
      category: 'ATTENDANCE',
      severity: 'HIGH',
      description: 'StudentAttendance entries found referencing non-existent Student.',
      count: orphanAttendance.length,
    });
  } else {
    passedChecks++;
  }

  // 5. Check for Student Marks without valid Examination Subject
  totalChecks++;
  const orphanMarks: any[] = await prisma.$queryRaw`
    SELECT m.id FROM StudentMarks m
    LEFT JOIN ExaminationSubject es ON m.examinationSubjectId = es.id
    WHERE es.id IS NULL
  `;
  if (orphanMarks.length > 0) {
    issues.push({
      category: 'EXAMINATIONS',
      severity: 'HIGH',
      description: 'StudentMarks entries found without associated ExaminationSubject.',
      count: orphanMarks.length,
    });
  } else {
    passedChecks++;
  }

  return {
    timestamp: new Date().toISOString(),
    totalChecks,
    passedChecks,
    issuesFound: issues,
  };
};

if (require.main === module) {
  runDataIntegrityCheck()
    .then((report) => {
      console.log('==============================================');
      console.log('       INSTITUTION DATA INTEGRITY AUDIT       ');
      console.log('==============================================');
      console.log(`Timestamp: ${report.timestamp}`);
      console.log(`Checks Run: ${report.totalChecks} | Passed: ${report.passedChecks}`);
      if (report.issuesFound.length === 0) {
        console.log('STATUS: ALL INTEGRITY CHECKS PASSED (0 ANOMALIES)');
      } else {
        console.log(`STATUS: ${report.issuesFound.length} ANOMALIES DETECTED`);
        report.issuesFound.forEach((issue) => {
          console.log(` - [${issue.severity}] ${issue.category}: ${issue.description} (${issue.count} records)`);
        });
      }
      console.log('==============================================');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Integrity check failed with error:', err);
      process.exit(1);
    });
}
