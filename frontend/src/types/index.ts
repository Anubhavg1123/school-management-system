export enum UserRoleEnum {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  HOD = 'HOD',
  FACULTY = 'FACULTY',
  NON_FACULTY = 'NON_FACULTY',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum UserStatusEnum {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED_PENDING_ROLE = 'APPROVED_PENDING_ROLE',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED',
}

export enum UserCategoryEnum {
  TEACHING_STAFF = 'TEACHING_STAFF',
  NON_TEACHING_STAFF = 'NON_TEACHING_STAFF',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  STUDENT = 'STUDENT',
  OTHER = 'OTHER',
}

export enum RegistrationStatusEnum {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED_PENDING_ROLE = 'APPROVED_PENDING_ROLE',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum StudentStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  LEFT_INSTITUTION = 'LEFT_INSTITUTION',
  GRADUATED = 'GRADUATED',
  SUSPENDED = 'SUSPENDED',
}

export enum StudentTransferTypeEnum {
  CLASS_TRANSFER = 'CLASS_TRANSFER',
  SECTION_TRANSFER = 'SECTION_TRANSFER',
  PROMOTION = 'PROMOTION',
  STATUS_CHANGE = 'STATUS_CHANGE',
  DEPT_TRANSFER = 'DEPT_TRANSFER',
}

export enum StudentDocumentTypeEnum {
  PHOTO = 'PHOTO',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  PREVIOUS_MARKSHEET = 'PREVIOUS_MARKSHEET',
  ID_PROOF = 'ID_PROOF',
  TRANSFER_CERTIFICATE = 'TRANSFER_CERTIFICATE',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
  OTHER = 'OTHER',
}

export enum LeaveTypeEnum {
  CASUAL = 'CASUAL',
  MEDICAL = 'MEDICAL',
  DUTY = 'DUTY',
  EARNED = 'EARNED',
  MATERNITY_PATERNITY = 'MATERNITY_PATERNITY',
  OTHER = 'OTHER',
}

export enum LeaveStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AttendanceStatusEnum {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  EXCUSED = 'EXCUSED',
}

export enum AttendanceSourceEnum {
  WEB = 'WEB',
  KIOSK = 'KIOSK',
  MANUAL = 'MANUAL',
}

export enum CorrectionStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Financial Enums
export enum FeeAssignmentStatusEnum {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum InstallmentStatusEnum {
  UPCOMING = 'UPCOMING',
  DUE = 'DUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum PaymentMethodEnum {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export enum PaymentStatusEnum {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum DiscountTypeEnum {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE = 'PERCENTAGE',
  SCHOLARSHIP = 'SCHOLARSHIP',
  CONCESSION = 'CONCESSION',
  WAIVER = 'WAIVER',
}

export enum RefundStatusEnum {
  PROCESSED = 'PROCESSED',
  CANCELLED = 'CANCELLED',
}

// Phase 5 Academic & Timetable Enums
export enum SubjectTypeEnum {
  THEORY = 'THEORY',
  PRACTICAL = 'PRACTICAL',
  LAB = 'LAB',
  ELECTIVE = 'ELECTIVE',
}

export enum RoomTypeEnum {
  CLASSROOM = 'CLASSROOM',
  LAB = 'LAB',
  COMPUTER_LAB = 'COMPUTER_LAB',
  SEMINAR_HALL = 'SEMINAR_HALL',
  AUDITORIUM = 'AUDITORIUM',
  SPORTS_AREA = 'SPORTS_AREA',
  OTHER = 'OTHER',
}

export enum DayOfWeekEnum {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum TimetableStatusEnum {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum ExtraClassStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum SubstituteStatusEnum {
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
}

export interface DepartmentHodHistory {
  id: string;
  departmentId: string;
  hodUserId: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  reason?: string | null;
  assignedByUserId?: string | null;
  createdAt: string;
  hod?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  hodUserId?: string | null;
  status: string;
  hod?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  hodHistory?: DepartmentHodHistory[];
  subjects?: Subject[];
  facultyMembers?: FacultyProfile[];
  classes?: ClassItem[];
  _count?: {
    facultyMembers: number;
    classes: number;
    students?: number;
    subjects?: number;
  };
}

export interface FacultyProfile {
  id: string;
  userId: string;
  employeeCode?: string | null;
  designation?: string | null;
  qualification?: string | null;
  joiningDate?: string | null;
  departmentId?: string | null;
  status?: string;
  department?: Department | null;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  whatsAppNumber?: string | null;
  altPhone?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  userCategory?: string | null;
  status: UserStatusEnum | string;
  roles: string[];
  activeRole: string;
  departmentId?: string | null;
  permissions: string[];
  lastLoginAt?: string | null;
  failedLoginAttempts?: number;
  lockoutUntil?: string | null;
  createdAt?: string;
  facultyProfile?: FacultyProfile | null;
  userRoles?: Array<{
    role: Role;
    department?: { id: string; name: string; code: string } | null;
  }>;
}

export interface RegistrationRequest {
  id: string;
  userId?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  whatsAppNumber?: string | null;
  userCategory?: string;
  requestedRole: Role | any;
  departmentId?: string | null;
  status: RegistrationStatusEnum | string;
  applicationNotes?: string | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  department?: Department | null;
  user: User;
}

export interface FacultyLeave {
  id: string;
  facultyUserId: string;
  leaveType: LeaveTypeEnum | string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason: string;
  status: LeaveStatusEnum | string;
  approvedByUserId?: string | null;
  reviewedBy?: { firstName: string; lastName: string } | null;
  reviewNotes?: string | null;
  createdAt: string;
  facultyUser?: User;
  user?: User;
}

export interface AttendanceRecord {
  id: string;
  userId?: string | null;
  studentId?: string | null;
  date: string;
  status: AttendanceStatusEnum | string;
  source: AttendanceSourceEnum | string;
  lateMinutes?: number | null;
  remarks?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  user?: User | null;
  student?: Student | null;
}

export interface AuditLogItem {
  id: string;
  action: string;
  resource: string;
  entityType?: string;
  entityId?: string | null;
  resourceId?: string | null;
  status?: string;
  errorMessage?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userRole?: string | null;
  user?: User | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: any;
  createdAt: string;
}

export type AuditLog = AuditLogItem;

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string | null;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  _count?: {
    classes: number;
    students: number;
    timetableEntries?: number;
  };
}

export interface ClassCoordinatorHistory {
  id: string;
  sectionId: string;
  facultyId: string;
  academicYearId: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  reason?: string | null;
  assignedByUserId?: string | null;
  createdAt: string;
  faculty?: FacultyProfile;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  type: SubjectTypeEnum | string;
  credits: number;
  departmentId?: string | null;
  description?: string | null;
  status: string;
  department?: Department | null;
  _count?: {
    classSubjects?: number;
    facultyAssignments?: number;
  };
}

export interface ClassSubject {
  id: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  isCompulsory: boolean;
  subject: Subject;
  class?: ClassItem;
}

export interface FacultySubjectAssignment {
  id: string;
  academicYearId: string;
  facultyId: string;
  classId: string;
  sectionId?: string | null;
  subjectId: string;
  assignedByUserId?: string | null;
  createdAt: string;
  faculty?: FacultyProfile;
  class?: ClassItem;
  section?: SectionItem | null;
  subject?: Subject;
}

export interface Room {
  id: string;
  roomNumber: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomTypeEnum | string;
  equipment?: string | null;
  status: string;
  createdAt?: string;
}

export interface TimeSlot {
  id: string;
  academicYearId: string;
  dayOfWeek: DayOfWeekEnum | string;
  periodNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface FacultyAvailability {
  id: string;
  facultyId: string;
  academicYearId: string;
  dayOfWeek: DayOfWeekEnum | string;
  timeSlotId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  isAvailable: boolean;
  reason?: string | null;
  timeSlot?: TimeSlot | null;
}

export interface TimetableEntry {
  id: string;
  academicYearId: string;
  departmentId?: string | null;
  classId: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  timeSlotId: string;
  dayOfWeek: DayOfWeekEnum | string;
  status: TimetableStatusEnum | string;
  class: ClassItem;
  section: SectionItem;
  subject: Subject;
  room: Room;
  timeSlot: TimeSlot;
  faculty: FacultyProfile;
}

export interface ExtraClassRequest {
  id: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  date: string;
  timeSlotId?: string | null;
  startTime: string;
  endTime: string;
  reason: string;
  status: ExtraClassStatusEnum | string;
  requestedByUserId: string;
  reviewedByUserId?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  class: ClassItem;
  section: SectionItem;
  subject: Subject;
  room: Room;
  faculty: FacultyProfile;
  requestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SubstituteFacultyAssignment {
  id: string;
  timetableEntryId?: string | null;
  originalFacultyId: string;
  substituteFacultyId: string;
  date: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  timeSlotId: string;
  roomId?: string | null;
  reason: string;
  status: SubstituteStatusEnum | string;
  assignedByUserId: string;
  createdAt: string;
  originalFaculty: FacultyProfile;
  substituteFaculty: FacultyProfile;
  class: ClassItem;
  section: SectionItem;
  subject: Subject;
  timeSlot: TimeSlot;
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  departmentId?: string | null;
  academicYearId: string;
  department?: Department | null;
  academicYear?: AcademicYear;
  sections?: SectionItem[];
  classSubjects?: ClassSubject[];
}

export interface SectionItem {
  id: string;
  classId: string;
  name: string;
  capacity: number;
  coordinatorFacultyId?: string | null;
  class?: ClassItem;
  coordinatorFaculty?: FacultyProfile | null;
  coordinatorHistories?: ClassCoordinatorHistory[];
  _count?: {
    students: number;
  };
}

export interface StudentTransferLog {
  id: string;
  studentId: string;
  fromAcademicYearId?: string | null;
  toAcademicYearId?: string | null;
  fromDepartmentId?: string | null;
  toDepartmentId?: string | null;
  fromClassId?: string | null;
  toClassId?: string | null;
  fromSectionId?: string | null;
  toSectionId?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  transferType: string;
  reason: string;
  effectiveDate: string;
  createdAt: string;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  docType: string;
  title: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  createdAt: string;
}

// ----------------------------------------------------
// FINANCIAL DATA TYPES
// ----------------------------------------------------

export interface FeeCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt?: string;
}

export interface FeeStructureItem {
  id: string;
  feeStructureId: string;
  feeCategoryId: string;
  amount: number;
  isOptional: boolean;
  dueDate?: string | null;
  installmentCount: number;
  feeCategory?: FeeCategory;
}

export interface FeeStructure {
  id: string;
  code: string;
  name: string;
  academicYearId: string;
  classId?: string | null;
  departmentId?: string | null;
  description?: string | null;
  status: string;
  createdAt?: string;
  academicYear?: AcademicYear;
  class?: ClassItem | null;
  department?: Department | null;
  items?: FeeStructureItem[];
  _count?: {
    assignments: number;
  };
}

export interface FeeInstallment {
  id: string;
  feeAssignmentId: string;
  installmentNumber: number;
  name: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: InstallmentStatusEnum | string;
}

export interface FeeDiscount {
  id: string;
  feeAssignmentId: string;
  studentId: string;
  type: DiscountTypeEnum | string;
  amount: number;
  percentage?: number | null;
  reason: string;
  status: string;
  approvedByUserId?: string | null;
  approvedBy?: {
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  amountPaid: number;
  totalAssigned: number;
  totalRemainingBalance: number;
  issuedDate: string;
  issuedByUserId?: string | null;
  notes?: string | null;
  issuedBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface Refund {
  id: string;
  refundNumber: string;
  paymentId: string;
  studentId: string;
  amount: number;
  reason: string;
  status: string;
  requestedByUserId?: string | null;
  approvedByUserId?: string | null;
  refundDate: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  studentId: string;
  feeAssignmentId: string;
  academicYearId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethodEnum | string;
  transactionReference?: string | null;
  status: PaymentStatusEnum | string;
  receivedByUserId?: string | null;
  notes?: string | null;
  student?: {
    id: string;
    admissionNumber: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  receipt?: Receipt | null;
  refunds?: Refund[];
  receivedBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface StudentFeeItem {
  id: string;
  feeAssignmentId: string;
  feeCategoryId: string;
  originalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  status: string;
  feeCategory?: FeeCategory;
}

export interface StudentFeeAssignment {
  id: string;
  studentId: string;
  feeStructureId: string;
  academicYearId: string;
  totalAssignedAmount: number;
  totalDiscountAmount: number;
  totalPaidAmount: number;
  totalRefundedAmount: number;
  netPayableAmount: number;
  status: FeeAssignmentStatusEnum | string;
  assignedAt: string;
  assignedByUserId?: string | null;
  notes?: string | null;
  student?: Student;
  feeStructure?: FeeStructure;
  academicYear?: AcademicYear;
  items?: StudentFeeItem[];
  installments?: FeeInstallment[];
  discounts?: FeeDiscount[];
  payments?: Payment[];
}

export interface Student {
  id: string;
  userId: string;
  campusId?: string | null;
  admissionNumber: string;
  enrollmentNumber?: string | null;
  rollNumber?: string | null;
  sectionId?: string | null;
  departmentId?: string | null;
  academicYearId?: string | null;
  admissionDate?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  previousSchool?: string | null;
  previousGrade?: string | null;
  previousScore?: string | null;
  photoUrl?: string | null;
  status: StudentStatusEnum | string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    whatsAppNumber?: string | null;
    altPhone?: string | null;
    address?: string | null;
    dob?: string | null;
    gender?: string | null;
  };
  section?: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
  department?: Department | null;
  academicYear?: AcademicYear | null;
  guardians?: Array<{
    id: string;
    fullName: string;
    relationship: string;
    phone: string;
    email?: string | null;
    occupation?: string | null;
    address?: string | null;
    isPrimary?: boolean;
  }>;
  transferHistory?: StudentTransferLog[];
  documents?: StudentDocument[];
  attendanceSummary?: {
    present: number;
    late: number;
    absent: number;
    totalMarked: number;
  };
}

export interface FinancialDashboardData {
  kpi: {
    totalAssigned: number;
    totalDiscount: number;
    totalNetPayable: number;
    totalCollected: number;
    totalRefunded: number;
    totalOutstanding: number;
    overdueAmount: number;
    todayCollected: number;
    monthCollected: number;
  };
  recentTransactions: Payment[];
  recentRefunds: Refund[];
}

export interface StudentFinancialProfile {
  student: Student;
  summary: {
    totalAssigned: number;
    totalDiscount: number;
    totalNetPayable: number;
    totalPaid: number;
    totalRefunded: number;
    totalOutstanding: number;
    overdueAmount: number;
    upcomingAmount: number;
  };
  assignments: StudentFeeAssignment[];
}

export interface HodDashboardData {
  department: Department;
  stats: {
    facultyCount: number;
    studentCount: number;
    classesCount: number;
    subjectsCount: number;
    activeLeavesCount: number;
    pendingExtraClassesCount: number;
  };
  facultyMembers: FacultyProfile[];
  activeLeaves: FacultyLeave[];
  pendingExtraClasses: ExtraClassRequest[];
}

export interface FacultyAcademicDashboardData {
  faculty: FacultyProfile;
  isCoordinator: boolean;
  coordinatedSections: Array<{
    sectionId: string;
    sectionName: string;
    className: string;
  }>;
  subjectAssignments: FacultySubjectAssignment[];
  timetableEntries: TimetableEntry[];
  extraClasses: ExtraClassRequest[];
  substituteLectures: SubstituteFacultyAssignment[];
}

export interface AttendanceSlot {
  id: string;
  academicYearId: string;
  date: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  facultyId: string;
  timeSlotId?: string | null;
  startTime: string;
  endTime: string;
  timetableEntryId?: string | null;
  extraClassRequestId?: string | null;
  status: string; // SCHEDULED, OPEN, IN_PROGRESS, SUBMITTED, FINALIZED, CANCELLED
  source: string; // AUTOMATIC, MANUAL, EXTRA_CLASS
  submissionDeadline?: string | null;
  class: ClassItem;
  section: SectionItem;
  subject: Subject;
  faculty: FacultyProfile;
  timeSlot?: TimeSlot | null;
  _count?: {
    studentAttendances: number;
  };
}

export interface StudentAttendanceRosterItem {
  studentId: string;
  userId: string;
  admissionNumber: string;
  enrollmentNumber?: string | null;
  rollNumber?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  whatsAppNumber?: string | null;
  photoUrl?: string | null;
  status: string; // PRESENT, ABSENT, LATE, EXCUSED, ACADEMIC_BYPASS
  remarks?: string | null;
  hasBypass: boolean;
  bypassActivity?: string | null;
  recordId?: string | null;
  corrections?: StudentAttendanceCorrection[];
}

export interface StudentAttendanceCorrection {
  id: string;
  studentAttendanceId: string;
  requestedByUserId: string;
  originalStatus: string;
  proposedStatus: string;
  reason: string;
  status: string; // PENDING, APPROVED, REJECTED
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  requestedBy?: User;
  studentAttendance?: {
    student: Student;
    attendanceSlot: AttendanceSlot;
  };
}

export interface AcademicBypassRequest {
  id: string;
  studentId: string;
  attendanceSlotId?: string | null;
  date: string;
  activityName: string;
  reason: string;
  status: string; // PENDING, APPROVED, REJECTED
  requestedByUserId: string;
  approvedByUserId?: string | null;
  createdAt: string;
  student?: Student;
  requestedBy?: User;
}

export interface AttendanceAnomaly {
  id: string;
  type: string;
  description: string;
  entityType: string;
  entityId?: string | null;
  userId?: string | null;
  createdAt: string;
  user?: User | null;
}

