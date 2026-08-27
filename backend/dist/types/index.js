"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubstituteStatusEnum = exports.ExtraClassStatusEnum = exports.TimetableStatusEnum = exports.DayOfWeekEnum = exports.RoomTypeEnum = exports.SubjectTypeEnum = exports.RefundStatusEnum = exports.DiscountTypeEnum = exports.PaymentStatusEnum = exports.PaymentMethodEnum = exports.InstallmentStatusEnum = exports.FeeAssignmentStatusEnum = exports.CorrectionStatusEnum = exports.AttendanceSourceEnum = exports.AttendanceStatusEnum = exports.LeaveStatusEnum = exports.LeaveTypeEnum = exports.StudentDocumentTypeEnum = exports.StudentTransferTypeEnum = exports.StudentStatusEnum = exports.RegistrationStatusEnum = exports.UserCategoryEnum = exports.UserStatusEnum = exports.UserRoleEnum = void 0;
var UserRoleEnum;
(function (UserRoleEnum) {
    UserRoleEnum["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRoleEnum["OFFICE_ADMIN"] = "OFFICE_ADMIN";
    UserRoleEnum["HOD"] = "HOD";
    UserRoleEnum["FACULTY"] = "FACULTY";
    UserRoleEnum["NON_FACULTY"] = "NON_FACULTY";
    UserRoleEnum["PARENT"] = "PARENT";
})(UserRoleEnum || (exports.UserRoleEnum = UserRoleEnum = {}));
var UserStatusEnum;
(function (UserStatusEnum) {
    UserStatusEnum["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    UserStatusEnum["ACTIVE"] = "ACTIVE";
    UserStatusEnum["INACTIVE"] = "INACTIVE";
    UserStatusEnum["SUSPENDED"] = "SUSPENDED";
    UserStatusEnum["LOCKED"] = "LOCKED";
})(UserStatusEnum || (exports.UserStatusEnum = UserStatusEnum = {}));
var UserCategoryEnum;
(function (UserCategoryEnum) {
    UserCategoryEnum["TEACHING_STAFF"] = "TEACHING_STAFF";
    UserCategoryEnum["NON_TEACHING_STAFF"] = "NON_TEACHING_STAFF";
    UserCategoryEnum["ADMINISTRATIVE"] = "ADMINISTRATIVE";
    UserCategoryEnum["STUDENT"] = "STUDENT";
    UserCategoryEnum["OTHER"] = "OTHER";
})(UserCategoryEnum || (exports.UserCategoryEnum = UserCategoryEnum = {}));
var RegistrationStatusEnum;
(function (RegistrationStatusEnum) {
    RegistrationStatusEnum["PENDING"] = "PENDING";
    RegistrationStatusEnum["UNDER_REVIEW"] = "UNDER_REVIEW";
    RegistrationStatusEnum["APPROVED"] = "APPROVED";
    RegistrationStatusEnum["REJECTED"] = "REJECTED";
})(RegistrationStatusEnum || (exports.RegistrationStatusEnum = RegistrationStatusEnum = {}));
var StudentStatusEnum;
(function (StudentStatusEnum) {
    StudentStatusEnum["ACTIVE"] = "ACTIVE";
    StudentStatusEnum["INACTIVE"] = "INACTIVE";
    StudentStatusEnum["TRANSFERRED"] = "TRANSFERRED";
    StudentStatusEnum["LEFT_INSTITUTION"] = "LEFT_INSTITUTION";
    StudentStatusEnum["GRADUATED"] = "GRADUATED";
    StudentStatusEnum["SUSPENDED"] = "SUSPENDED";
})(StudentStatusEnum || (exports.StudentStatusEnum = StudentStatusEnum = {}));
var StudentTransferTypeEnum;
(function (StudentTransferTypeEnum) {
    StudentTransferTypeEnum["CLASS_TRANSFER"] = "CLASS_TRANSFER";
    StudentTransferTypeEnum["SECTION_TRANSFER"] = "SECTION_TRANSFER";
    StudentTransferTypeEnum["PROMOTION"] = "PROMOTION";
    StudentTransferTypeEnum["STATUS_CHANGE"] = "STATUS_CHANGE";
    StudentTransferTypeEnum["DEPT_TRANSFER"] = "DEPT_TRANSFER";
})(StudentTransferTypeEnum || (exports.StudentTransferTypeEnum = StudentTransferTypeEnum = {}));
var StudentDocumentTypeEnum;
(function (StudentDocumentTypeEnum) {
    StudentDocumentTypeEnum["PHOTO"] = "PHOTO";
    StudentDocumentTypeEnum["BIRTH_CERTIFICATE"] = "BIRTH_CERTIFICATE";
    StudentDocumentTypeEnum["PREVIOUS_MARKSHEET"] = "PREVIOUS_MARKSHEET";
    StudentDocumentTypeEnum["ID_PROOF"] = "ID_PROOF";
    StudentDocumentTypeEnum["TRANSFER_CERTIFICATE"] = "TRANSFER_CERTIFICATE";
    StudentDocumentTypeEnum["MEDICAL_RECORD"] = "MEDICAL_RECORD";
    StudentDocumentTypeEnum["OTHER"] = "OTHER";
})(StudentDocumentTypeEnum || (exports.StudentDocumentTypeEnum = StudentDocumentTypeEnum = {}));
var LeaveTypeEnum;
(function (LeaveTypeEnum) {
    LeaveTypeEnum["CASUAL"] = "CASUAL";
    LeaveTypeEnum["MEDICAL"] = "MEDICAL";
    LeaveTypeEnum["DUTY"] = "DUTY";
    LeaveTypeEnum["EARNED"] = "EARNED";
    LeaveTypeEnum["MATERNITY_PATERNITY"] = "MATERNITY_PATERNITY";
    LeaveTypeEnum["OTHER"] = "OTHER";
})(LeaveTypeEnum || (exports.LeaveTypeEnum = LeaveTypeEnum = {}));
var LeaveStatusEnum;
(function (LeaveStatusEnum) {
    LeaveStatusEnum["PENDING"] = "PENDING";
    LeaveStatusEnum["APPROVED"] = "APPROVED";
    LeaveStatusEnum["REJECTED"] = "REJECTED";
})(LeaveStatusEnum || (exports.LeaveStatusEnum = LeaveStatusEnum = {}));
var AttendanceStatusEnum;
(function (AttendanceStatusEnum) {
    AttendanceStatusEnum["PRESENT"] = "PRESENT";
    AttendanceStatusEnum["ABSENT"] = "ABSENT";
    AttendanceStatusEnum["LATE"] = "LATE";
    AttendanceStatusEnum["HALF_DAY"] = "HALF_DAY";
    AttendanceStatusEnum["EXCUSED"] = "EXCUSED";
})(AttendanceStatusEnum || (exports.AttendanceStatusEnum = AttendanceStatusEnum = {}));
var AttendanceSourceEnum;
(function (AttendanceSourceEnum) {
    AttendanceSourceEnum["WEB"] = "WEB";
    AttendanceSourceEnum["KIOSK"] = "KIOSK";
    AttendanceSourceEnum["MANUAL"] = "MANUAL";
})(AttendanceSourceEnum || (exports.AttendanceSourceEnum = AttendanceSourceEnum = {}));
var CorrectionStatusEnum;
(function (CorrectionStatusEnum) {
    CorrectionStatusEnum["PENDING"] = "PENDING";
    CorrectionStatusEnum["APPROVED"] = "APPROVED";
    CorrectionStatusEnum["REJECTED"] = "REJECTED";
})(CorrectionStatusEnum || (exports.CorrectionStatusEnum = CorrectionStatusEnum = {}));
// Phase 4 Financial Enums
var FeeAssignmentStatusEnum;
(function (FeeAssignmentStatusEnum) {
    FeeAssignmentStatusEnum["UNPAID"] = "UNPAID";
    FeeAssignmentStatusEnum["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    FeeAssignmentStatusEnum["PAID"] = "PAID";
    FeeAssignmentStatusEnum["OVERDUE"] = "OVERDUE";
    FeeAssignmentStatusEnum["CANCELLED"] = "CANCELLED";
})(FeeAssignmentStatusEnum || (exports.FeeAssignmentStatusEnum = FeeAssignmentStatusEnum = {}));
var InstallmentStatusEnum;
(function (InstallmentStatusEnum) {
    InstallmentStatusEnum["UPCOMING"] = "UPCOMING";
    InstallmentStatusEnum["DUE"] = "DUE";
    InstallmentStatusEnum["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    InstallmentStatusEnum["PAID"] = "PAID";
    InstallmentStatusEnum["OVERDUE"] = "OVERDUE";
})(InstallmentStatusEnum || (exports.InstallmentStatusEnum = InstallmentStatusEnum = {}));
var PaymentMethodEnum;
(function (PaymentMethodEnum) {
    PaymentMethodEnum["CASH"] = "CASH";
    PaymentMethodEnum["UPI"] = "UPI";
    PaymentMethodEnum["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethodEnum["ONLINE"] = "ONLINE";
    PaymentMethodEnum["CHEQUE"] = "CHEQUE";
    PaymentMethodEnum["OTHER"] = "OTHER";
})(PaymentMethodEnum || (exports.PaymentMethodEnum = PaymentMethodEnum = {}));
var PaymentStatusEnum;
(function (PaymentStatusEnum) {
    PaymentStatusEnum["SUCCESS"] = "SUCCESS";
    PaymentStatusEnum["PENDING"] = "PENDING";
    PaymentStatusEnum["FAILED"] = "FAILED";
    PaymentStatusEnum["CANCELLED"] = "CANCELLED";
    PaymentStatusEnum["REFUNDED"] = "REFUNDED";
    PaymentStatusEnum["PARTIALLY_REFUNDED"] = "PARTIALLY_REFUNDED";
})(PaymentStatusEnum || (exports.PaymentStatusEnum = PaymentStatusEnum = {}));
var DiscountTypeEnum;
(function (DiscountTypeEnum) {
    DiscountTypeEnum["FIXED_AMOUNT"] = "FIXED_AMOUNT";
    DiscountTypeEnum["PERCENTAGE"] = "PERCENTAGE";
    DiscountTypeEnum["SCHOLARSHIP"] = "SCHOLARSHIP";
    DiscountTypeEnum["CONCESSION"] = "CONCESSION";
    DiscountTypeEnum["WAIVER"] = "WAIVER";
})(DiscountTypeEnum || (exports.DiscountTypeEnum = DiscountTypeEnum = {}));
var RefundStatusEnum;
(function (RefundStatusEnum) {
    RefundStatusEnum["PROCESSED"] = "PROCESSED";
    RefundStatusEnum["CANCELLED"] = "CANCELLED";
})(RefundStatusEnum || (exports.RefundStatusEnum = RefundStatusEnum = {}));
// Phase 5 Academic and Timetable Enums
var SubjectTypeEnum;
(function (SubjectTypeEnum) {
    SubjectTypeEnum["THEORY"] = "THEORY";
    SubjectTypeEnum["PRACTICAL"] = "PRACTICAL";
    SubjectTypeEnum["LAB"] = "LAB";
    SubjectTypeEnum["ELECTIVE"] = "ELECTIVE";
})(SubjectTypeEnum || (exports.SubjectTypeEnum = SubjectTypeEnum = {}));
var RoomTypeEnum;
(function (RoomTypeEnum) {
    RoomTypeEnum["CLASSROOM"] = "CLASSROOM";
    RoomTypeEnum["LAB"] = "LAB";
    RoomTypeEnum["COMPUTER_LAB"] = "COMPUTER_LAB";
    RoomTypeEnum["SEMINAR_HALL"] = "SEMINAR_HALL";
    RoomTypeEnum["AUDITORIUM"] = "AUDITORIUM";
    RoomTypeEnum["SPORTS_AREA"] = "SPORTS_AREA";
    RoomTypeEnum["OTHER"] = "OTHER";
})(RoomTypeEnum || (exports.RoomTypeEnum = RoomTypeEnum = {}));
var DayOfWeekEnum;
(function (DayOfWeekEnum) {
    DayOfWeekEnum["MONDAY"] = "MONDAY";
    DayOfWeekEnum["TUESDAY"] = "TUESDAY";
    DayOfWeekEnum["WEDNESDAY"] = "WEDNESDAY";
    DayOfWeekEnum["THURSDAY"] = "THURSDAY";
    DayOfWeekEnum["FRIDAY"] = "FRIDAY";
    DayOfWeekEnum["SATURDAY"] = "SATURDAY";
    DayOfWeekEnum["SUNDAY"] = "SUNDAY";
})(DayOfWeekEnum || (exports.DayOfWeekEnum = DayOfWeekEnum = {}));
var TimetableStatusEnum;
(function (TimetableStatusEnum) {
    TimetableStatusEnum["ACTIVE"] = "ACTIVE";
    TimetableStatusEnum["CANCELLED"] = "CANCELLED";
    TimetableStatusEnum["MOVED"] = "MOVED";
})(TimetableStatusEnum || (exports.TimetableStatusEnum = TimetableStatusEnum = {}));
var ExtraClassStatusEnum;
(function (ExtraClassStatusEnum) {
    ExtraClassStatusEnum["PENDING"] = "PENDING";
    ExtraClassStatusEnum["APPROVED"] = "APPROVED";
    ExtraClassStatusEnum["REJECTED"] = "REJECTED";
    ExtraClassStatusEnum["CANCELLED"] = "CANCELLED";
})(ExtraClassStatusEnum || (exports.ExtraClassStatusEnum = ExtraClassStatusEnum = {}));
var SubstituteStatusEnum;
(function (SubstituteStatusEnum) {
    SubstituteStatusEnum["CONFIRMED"] = "CONFIRMED";
    SubstituteStatusEnum["COMPLETED"] = "COMPLETED";
    SubstituteStatusEnum["CANCELLED"] = "CANCELLED";
})(SubstituteStatusEnum || (exports.SubstituteStatusEnum = SubstituteStatusEnum = {}));
