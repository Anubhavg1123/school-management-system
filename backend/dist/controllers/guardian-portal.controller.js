"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferences = exports.getWardFees = exports.getWardResults = exports.getLinkedWards = exports.getGuardianDashboard = void 0;
const guardian_portal_service_1 = require("../services/guardian-portal.service");
const getGuardianDashboard = async (req, res, next) => {
    try {
        const parentUserId = req.user.id;
        const studentId = req.query.studentId ? String(req.query.studentId) : undefined;
        const data = await guardian_portal_service_1.GuardianPortalService.getDashboard(parentUserId, studentId);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getGuardianDashboard = getGuardianDashboard;
const getLinkedWards = async (req, res, next) => {
    try {
        const parentUserId = req.user.id;
        const data = await guardian_portal_service_1.GuardianPortalService.getLinkedWards(parentUserId);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getLinkedWards = getLinkedWards;
const getWardResults = async (req, res, next) => {
    try {
        const parentUserId = req.user.id;
        const studentId = String(req.params.studentId);
        const data = await guardian_portal_service_1.GuardianPortalService.getWardResults(parentUserId, studentId);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getWardResults = getWardResults;
const getWardFees = async (req, res, next) => {
    try {
        const parentUserId = req.user.id;
        const studentId = String(req.params.studentId);
        const data = await guardian_portal_service_1.GuardianPortalService.getWardFees(parentUserId, studentId);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getWardFees = getWardFees;
const updatePreferences = async (req, res, next) => {
    try {
        const parentUserId = req.user.id;
        const data = await guardian_portal_service_1.GuardianPortalService.updatePreferences(parentUserId, req.body);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePreferences = updatePreferences;
