"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableMfa = exports.verifyAndEnableMfa = exports.initiateMfaSetup = void 0;
const mfa_service_1 = require("../services/mfa.service");
const initiateMfaSetup = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = await mfa_service_1.MfaService.initiateMfaSetup(userId);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.initiateMfaSetup = initiateMfaSetup;
const verifyAndEnableMfa = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        const data = await mfa_service_1.MfaService.confirmAndEnableMfa(userId, token);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyAndEnableMfa = verifyAndEnableMfa;
const disableMfa = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = await mfa_service_1.MfaService.disableMfa(userId);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.disableMfa = disableMfa;
