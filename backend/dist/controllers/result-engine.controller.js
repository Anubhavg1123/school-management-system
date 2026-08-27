"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultEngineController = void 0;
const response_1 = require("../utils/response");
const result_engine_service_1 = require("../services/result-engine.service");
class ResultEngineController {
    static async calculateResults(req, res) {
        const results = await result_engine_service_1.ResultEngineService.calculateExamResults(req.user.id, req.params.examId);
        return (0, response_1.sendSuccess)(res, results, 200);
    }
    static async publishResults(req, res) {
        const result = await result_engine_service_1.ResultEngineService.publishExamResults(req.user.id, req.params.examId);
        return (0, response_1.sendSuccess)(res, result, 200);
    }
    static async getStudentResults(req, res) {
        const results = await result_engine_service_1.ResultEngineService.getStudentResults(req.user.id, req.user.activeRole, req.params.studentId);
        return (0, response_1.sendSuccess)(res, results, 200);
    }
    static async verifyToken(req, res) {
        const tokenInfo = await result_engine_service_1.ResultEngineService.verifyResultToken(req.params.token);
        return (0, response_1.sendSuccess)(res, tokenInfo, 200);
    }
}
exports.ResultEngineController = ResultEngineController;
