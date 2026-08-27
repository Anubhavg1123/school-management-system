"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academic_controller_1 = require("../controllers/academic.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// ----------------------------------------------------
// 1. DEPARTMENTS & HOD MANAGEMENT
// ----------------------------------------------------
router.get('/departments', academic_controller_1.AcademicController.listDepartments);
router.get('/departments/:id', academic_controller_1.AcademicController.getDepartmentById);
router.post('/departments', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.createDepartmentSchema }), academic_controller_1.AcademicController.createDepartment);
router.put('/departments/:id', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.updateDepartmentSchema }), academic_controller_1.AcademicController.updateDepartment);
router.post('/departments/:id/assign-hod', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.assignHodSchema }), academic_controller_1.AcademicController.assignDepartmentHod);
// ----------------------------------------------------
// 2. ACADEMIC YEARS
// ----------------------------------------------------
router.get('/years', academic_controller_1.AcademicController.listAcademicYears);
router.post('/years', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.createAcademicYearSchema }), academic_controller_1.AcademicController.createAcademicYear);
router.patch('/years/:id/status', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.setAcademicYearStatusSchema }), academic_controller_1.AcademicController.setAcademicYearStatus);
// ----------------------------------------------------
// 3. CLASSES, SECTIONS & COORDINATORS
// ----------------------------------------------------
router.get('/classes', academic_controller_1.AcademicController.listClasses);
router.post('/classes', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.createClassSchema }), academic_controller_1.AcademicController.createClass);
router.get('/sections', academic_controller_1.AcademicController.listSections);
router.post('/sections', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.createSectionSchema }), academic_controller_1.AcademicController.createSection);
router.post('/sections/:id/assign-coordinator', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: academic_controller_1.assignCoordinatorSchema }), academic_controller_1.AcademicController.assignCoordinator);
// ----------------------------------------------------
// 4. SUBJECTS & CLASS SUBJECTS
// ----------------------------------------------------
router.get('/subjects', academic_controller_1.AcademicController.listSubjects);
router.post('/subjects', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.createSubjectSchema }), academic_controller_1.AcademicController.createSubject);
router.put('/subjects/:id', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.updateSubjectSchema }), academic_controller_1.AcademicController.updateSubject);
router.post('/classes/:classId/subjects', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: academic_controller_1.assignClassSubjectsSchema }), academic_controller_1.AcademicController.assignClassSubjects);
router.get('/classes/:classId/subjects', academic_controller_1.AcademicController.getClassSubjects);
// ----------------------------------------------------
// 5. FACULTY SUBJECT ASSIGNMENTS
// ----------------------------------------------------
router.post('/faculty/assign-subject', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: academic_controller_1.assignFacultySubjectSchema }), academic_controller_1.AcademicController.assignFacultySubject);
router.get('/faculty/assignments', academic_controller_1.AcademicController.listFacultyAssignments);
router.delete('/faculty/assignments/:id', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), academic_controller_1.AcademicController.deleteFacultyAssignment);
// ----------------------------------------------------
// 6. ROOMS & TIME SLOTS
// ----------------------------------------------------
router.get('/rooms', academic_controller_1.AcademicController.listRooms);
router.post('/rooms', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.createRoomSchema }), academic_controller_1.AcademicController.createRoom);
router.put('/rooms/:id', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.updateRoomSchema }), academic_controller_1.AcademicController.updateRoom);
router.get('/time-slots', academic_controller_1.AcademicController.listTimeSlots);
router.post('/time-slots', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.createTimeSlotSchema }), academic_controller_1.AcademicController.createTimeSlot);
router.post('/time-slots/generate-defaults', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), academic_controller_1.AcademicController.generateDefaultTimeSlots);
// ----------------------------------------------------
// 7. FACULTY AVAILABILITY
// ----------------------------------------------------
router.get('/faculty/:facultyId/availability', academic_controller_1.AcademicController.getFacultyAvailability);
router.post('/faculty/availability', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), (0, validate_1.validateRequest)({ body: academic_controller_1.setFacultyAvailabilitySchema }), academic_controller_1.AcademicController.setFacultyAvailability);
// ----------------------------------------------------
// 8. TIMETABLE
// ----------------------------------------------------
router.get('/timetable', academic_controller_1.AcademicController.getTimetable);
router.post('/timetable', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: academic_controller_1.createTimetableEntrySchema }), academic_controller_1.AcademicController.createTimetableEntry);
router.put('/timetable/:id', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: academic_controller_1.updateTimetableEntrySchema }), academic_controller_1.AcademicController.updateTimetableEntry);
router.delete('/timetable/:id', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), academic_controller_1.AcademicController.deleteTimetableEntry);
router.post('/timetable/conflicts/check', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), (0, validate_1.validateRequest)({ body: academic_controller_1.checkTimetableConflictsSchema }), academic_controller_1.AcademicController.checkConflicts);
// ----------------------------------------------------
// 9. EXTRA CLASSES
// ----------------------------------------------------
router.post('/extra-classes', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), (0, validate_1.validateRequest)({ body: academic_controller_1.requestExtraClassSchema }), academic_controller_1.AcademicController.requestExtraClass);
router.get('/extra-classes', academic_controller_1.AcademicController.listExtraClasses);
router.post('/extra-classes/:id/review', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: academic_controller_1.reviewExtraClassSchema }), academic_controller_1.AcademicController.reviewExtraClass);
// ----------------------------------------------------
// 10. SUBSTITUTE FACULTY
// ----------------------------------------------------
router.post('/substitute-faculty', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: academic_controller_1.assignSubstituteSchema }), academic_controller_1.AcademicController.assignSubstitute);
router.get('/substitute-faculty', academic_controller_1.AcademicController.listSubstitutes);
// ----------------------------------------------------
// 11. DASHBOARDS
// ----------------------------------------------------
router.get('/dashboard/hod/:departmentId?', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.HOD]), academic_controller_1.AcademicController.getHodDashboard);
router.get('/dashboard/faculty', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.FACULTY, types_1.UserRoleEnum.HOD]), academic_controller_1.AcademicController.getFacultyAcademicDashboard);
// ----------------------------------------------------
// 12. STUDENTS & ADMISSIONS (RETAINED FROM PHASE 3)
// ----------------------------------------------------
router.get('/students', academic_controller_1.AcademicController.listStudents);
router.get('/students/:id', academic_controller_1.AcademicController.getStudentById);
router.post('/students/admit', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.admitStudentSchema }), academic_controller_1.AcademicController.admitStudent);
router.post('/students/:id/transfer', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.transferStudentSchema }), academic_controller_1.AcademicController.transferStudent);
router.patch('/students/:id/status', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.updateStudentStatusSchema }), academic_controller_1.AcademicController.updateStudentStatus);
router.post('/students/:id/documents', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (0, validate_1.validateRequest)({ body: academic_controller_1.uploadDocumentSchema }), academic_controller_1.AcademicController.uploadDocument);
exports.default = router;
