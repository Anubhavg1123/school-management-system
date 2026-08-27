import { Request } from 'express';

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

// Phase 4 Financial Enums
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

// Phase 5 Academic and Timetable Enums
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
  MOVED = 'MOVED',
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

export interface AuthenticatedUser {
  id: string;
  email: string;
  username?: string | null;
  firstName: string;
  lastName: string;
  phone?: string | null;
  whatsAppNumber?: string | null;
  userCategory?: string | null;
  status: string;
  roles: string[];
  activeRole: string;
  departmentId?: string | null;
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username?: string | null;
  roles: string[];
  activeRole: string;
  departmentId?: string | null;
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
