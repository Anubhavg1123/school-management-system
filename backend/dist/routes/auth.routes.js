"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_1 = require("../middleware/validate");
const rateLimit_1 = require("../middleware/rateLimit");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes with rate limiting
router.post('/register', rateLimit_1.authRateLimiter, (0, validate_1.validateRequest)({ body: auth_controller_1.registerSchema }), auth_controller_1.AuthController.register);
router.post('/login', rateLimit_1.authRateLimiter, (0, validate_1.validateRequest)({ body: auth_controller_1.loginSchema }), auth_controller_1.AuthController.login);
router.post('/refresh', rateLimit_1.authRateLimiter, (0, validate_1.validateRequest)({ body: auth_controller_1.refreshTokenSchema }), auth_controller_1.AuthController.refresh);
const mfa_routes_1 = __importDefault(require("./mfa.routes"));
// Authenticated session routes
router.get('/me', auth_1.requireAuth, auth_controller_1.AuthController.me);
router.post('/logout', auth_1.requireAuth, auth_controller_1.AuthController.logout);
router.post('/logout-all', auth_1.requireAuth, auth_controller_1.AuthController.logoutAll);
router.post('/change-password', auth_1.requireAuth, (0, validate_1.validateRequest)({ body: auth_controller_1.changePasswordSchema }), auth_controller_1.AuthController.changePassword);
router.use('/mfa', mfa_routes_1.default);
exports.default = router;
