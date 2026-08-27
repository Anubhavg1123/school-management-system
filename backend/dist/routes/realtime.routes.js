"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeRouter = void 0;
const express_1 = require("express");
const realtime_controller_1 = require("../controllers/realtime.controller");
const auth_1 = require("../middleware/auth");
exports.realtimeRouter = (0, express_1.Router)();
// Stream SSE events (Authenticated)
exports.realtimeRouter.get('/stream', auth_1.requireAuth, realtime_controller_1.RealtimeController.streamEvents);
exports.realtimeRouter.get('/stats', auth_1.requireAuth, realtime_controller_1.RealtimeController.getStats);
exports.default = exports.realtimeRouter;
