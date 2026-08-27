import { Router } from 'express';
import {
  AcademicController,
  createDepartmentSchema,
  updateDepartmentSchema,
  assignHodSchema,
  createAcademicYearSchema,
  setAcademicYearStatusSchema,
  createClassSchema,
  createSectionSchema,
  assignCoordinatorSchema,
  createSubjectSchema,
  updateSubjectSchema,
  assignClassSubjectsSchema,
  assignFacultySubjectSchema,
  createRoomSchema,
  updateRoomSchema,
  createTimeSlotSchema,
  updateTimeSlotSchema,
  setFacultyAvailabilitySchema,
  createTimetableEntrySchema,
  generateTimetableGridSchema,
  updateTimetableEntrySchema,
  checkTimetableConflictsSchema,
  requestExtraClassSchema,
  reviewExtraClassSchema,
  assignSubstituteSchema,
  admitStudentSchema,
  transferStudentSchema,
  updateStudentStatusSchema,
  uploadDocumentSchema,
} from '../controllers/academic.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { UserRoleEnum } from '../types';

const router = Router();

// Public department listing for registration and portal views
router.get('/departments', AcademicController.listDepartments);

router.use(requireAuth);

// ----------------------------------------------------
// 1. DEPARTMENTS & HOD MANAGEMENT
// ----------------------------------------------------
router.get('/departments/:id', AcademicController.getDepartmentById);

router.post(
  '/departments',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  validateRequest({ body: createDepartmentSchema }),
  AcademicController.createDepartment
);

router.put(
  '/departments/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  validateRequest({ body: updateDepartmentSchema }),
  AcademicController.updateDepartment
);

router.post(
  '/departments/:id/assign-hod',
  requireRoles([UserRoleEnum.SUPER_ADMIN]),
  validateRequest({ body: assignHodSchema }),
  AcademicController.assignDepartmentHod
);

// ----------------------------------------------------
// 2. ACADEMIC YEARS
// ----------------------------------------------------
router.get('/years', AcademicController.listAcademicYears);

router.post(
  '/years',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: createAcademicYearSchema }),
  AcademicController.createAcademicYear
);

router.patch(
  '/years/:id/status',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: setAcademicYearStatusSchema }),
  AcademicController.setAcademicYearStatus
);

// ----------------------------------------------------
// 3. CLASSES, SECTIONS & COORDINATORS
// ----------------------------------------------------
router.get('/classes', AcademicController.listClasses);

router.post(
  '/classes',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: createClassSchema }),
  AcademicController.createClass
);

router.get('/sections', AcademicController.listSections);

router.post(
  '/sections',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: createSectionSchema }),
  AcademicController.createSection
);

router.post(
  '/sections/:id/assign-coordinator',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: assignCoordinatorSchema }),
  AcademicController.assignCoordinator
);

router.post(
  '/sections/:id/unassign-coordinator',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  AcademicController.unassignCoordinator
);

router.get(
  '/sections/:id/coordinator-history',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  AcademicController.getCoordinatorHistory
);

// ----------------------------------------------------
// 4. SUBJECTS & CLASS SUBJECTS
// ----------------------------------------------------
router.get('/subjects', AcademicController.listSubjects);

router.post(
  '/subjects',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: createSubjectSchema }),
  AcademicController.createSubject
);

router.put(
  '/subjects/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: updateSubjectSchema }),
  AcademicController.updateSubject
);

router.post(
  '/classes/:classId/subjects',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: assignClassSubjectsSchema }),
  AcademicController.assignClassSubjects
);

router.get('/classes/:classId/subjects', AcademicController.getClassSubjects);

// ----------------------------------------------------
// 5. FACULTY SUBJECT ASSIGNMENTS
// ----------------------------------------------------
router.post(
  '/faculty/assign-subject',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: assignFacultySubjectSchema }),
  AcademicController.assignFacultySubject
);

router.get('/faculty/assignments', AcademicController.listFacultyAssignments);

router.delete(
  '/faculty/assignments/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  AcademicController.deleteFacultyAssignment
);

// ----------------------------------------------------
// 6. ROOMS & TIME SLOTS
// ----------------------------------------------------
router.get('/rooms', AcademicController.listRooms);

router.post(
  '/rooms',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: createRoomSchema }),
  AcademicController.createRoom
);

router.put(
  '/rooms/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: updateRoomSchema }),
  AcademicController.updateRoom
);

router.get('/time-slots', AcademicController.listTimeSlots);

router.post(
  '/time-slots',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: createTimeSlotSchema }),
  AcademicController.createTimeSlot
);

router.put(
  '/time-slots/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: updateTimeSlotSchema }),
  AcademicController.updateTimeSlot
);

router.delete(
  '/time-slots/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  AcademicController.deleteTimeSlot
);

router.post(
  '/time-slots/generate-defaults',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  AcademicController.generateDefaultTimeSlots
);

// ----------------------------------------------------
// 7. FACULTY AVAILABILITY
// ----------------------------------------------------
router.get('/faculty/:facultyId/availability', AcademicController.getFacultyAvailability);

router.post(
  '/faculty/availability',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  validateRequest({ body: setFacultyAvailabilitySchema }),
  AcademicController.setFacultyAvailability
);

// ----------------------------------------------------
// 8. TIMETABLE
// ----------------------------------------------------
router.get('/timetable', AcademicController.getTimetable);

router.post(
  '/timetable',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: createTimetableEntrySchema }),
  AcademicController.createTimetableEntry
);

router.post(
  '/timetable/generate-grid',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: generateTimetableGridSchema }),
  AcademicController.generateTimetableGrid
);

router.put(
  '/timetable/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: updateTimetableEntrySchema }),
  AcademicController.updateTimetableEntry
);

router.delete(
  '/timetable/:id',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  AcademicController.deleteTimetableEntry
);

router.post(
  '/timetable/conflicts/check',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  validateRequest({ body: checkTimetableConflictsSchema }),
  AcademicController.checkConflicts
);

// ----------------------------------------------------
// 9. EXTRA CLASSES
// ----------------------------------------------------
router.post(
  '/extra-classes',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD, UserRoleEnum.FACULTY]),
  validateRequest({ body: requestExtraClassSchema }),
  AcademicController.requestExtraClass
);

router.get('/extra-classes', AcademicController.listExtraClasses);

router.post(
  '/extra-classes/:id/review',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: reviewExtraClassSchema }),
  AcademicController.reviewExtraClass
);

// ----------------------------------------------------
// 10. SUBSTITUTE FACULTY
// ----------------------------------------------------
router.post(
  '/substitute-faculty',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]),
  validateRequest({ body: assignSubstituteSchema }),
  AcademicController.assignSubstitute
);

router.get('/substitute-faculty', AcademicController.listSubstitutes);

// ----------------------------------------------------
// 11. DASHBOARDS
// ----------------------------------------------------
router.get(
  '/dashboard/hod/:departmentId?',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.HOD]),
  AcademicController.getHodDashboard
);

router.get(
  '/dashboard/faculty',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.FACULTY, UserRoleEnum.HOD]),
  AcademicController.getFacultyAcademicDashboard
);

// ----------------------------------------------------
// 12. STUDENTS & ADMISSIONS (RETAINED FROM PHASE 3)
// ----------------------------------------------------
router.get('/students', AcademicController.listStudents);
router.get('/students/:id', AcademicController.getStudentById);

router.post(
  '/students/admit',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: admitStudentSchema }),
  AcademicController.admitStudent
);

router.post(
  '/students/:id/transfer',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: transferStudentSchema }),
  AcademicController.transferStudent
);

router.patch(
  '/students/:id/status',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: updateStudentStatusSchema }),
  AcademicController.updateStudentStatus
);

router.post(
  '/students/:id/documents',
  requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]),
  validateRequest({ body: uploadDocumentSchema }),
  AcademicController.uploadDocument
);

export default router;
