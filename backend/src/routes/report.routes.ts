import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

router.get(
  '/students/roster',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  ReportController.getStudentRoster
);

router.get(
  '/classes',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  ReportController.getClassWise
);

router.get(
  '/departments',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  ReportController.getDepartmentWise
);

router.get(
  '/transfers',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  ReportController.getTransfers
);

router.get(
  '/admissions',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  ReportController.getAdmissions
);

// ===== PHASE 15: EXTENDED REPORTS =====

router.get(
  '/attendance',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  ReportController.getAttendanceReport
);

router.get(
  '/finance',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  ReportController.getFinanceReport
);

router.get(
  '/examinations',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  ReportController.getExaminationReport
);

router.get(
  '/staff',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  ReportController.getStaffReport
);

router.get(
  '/visitors',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  ReportController.getVisitorReport
);

router.get(
  '/audit',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  ReportController.getAuditReport
);

export default router;

