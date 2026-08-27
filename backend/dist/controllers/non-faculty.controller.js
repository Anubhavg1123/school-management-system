"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonFacultyController = void 0;
const response_1 = require("../utils/response");
const non_faculty_service_1 = require("../services/non-faculty.service");
const zod_1 = require("zod");
const markAttenderAttendanceSchema = zod_1.z.object({
    targetUserId: zod_1.z.string().min(1, 'Target user ID is required'),
    action: zod_1.z.enum(['CHECK_IN', 'CHECK_OUT']),
    remarks: zod_1.z.string().optional(),
});
const createStaffCategorySchema = zod_1.z.object({
    code: zod_1.z.string().min(2, 'Category code required'),
    name: zod_1.z.string().min(2, 'Category name required'),
    description: zod_1.z.string().optional(),
});
class NonFacultyController {
    static async getDashboard(req, res) {
        const data = await non_faculty_service_1.NonFacultyService.getDashboard(req.user.id);
        return (0, response_1.sendSuccess)(res, data, 200);
    }
    static async getStaffCategories(req, res) {
        const categories = await non_faculty_service_1.NonFacultyService.getStaffCategories();
        return (0, response_1.sendSuccess)(res, categories, 200);
    }
    static async createStaffCategory(req, res) {
        const validated = createStaffCategorySchema.parse(req.body);
        const category = await non_faculty_service_1.NonFacultyService.createStaffCategory(validated);
        return (0, response_1.sendSuccess)(res, category, 201);
    }
    static async attenderMarkAttendance(req, res) {
        const validated = markAttenderAttendanceSchema.parse(req.body);
        const record = await non_faculty_service_1.NonFacultyService.attenderMarkAttendance(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, record, 201);
    }
    static async getAttenderDashboard(req, res) {
        const data = await non_faculty_service_1.NonFacultyService.getAttenderDashboard(req.user.id);
        return (0, response_1.sendSuccess)(res, data, 200);
    }
}
exports.NonFacultyController = NonFacultyController;
