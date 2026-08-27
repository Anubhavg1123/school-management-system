"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api',
    databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_dev_access_secret_change_in_prod_123',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_dev_refresh_secret_change_in_prod_123',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    security: {
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
        lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
    },
    initialAdmin: {
        email: process.env.INITIAL_ADMIN_EMAIL || 'principal@school.edu',
        username: process.env.INITIAL_ADMIN_USERNAME || 'principal',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@SecurePassword2026!',
        firstName: process.env.INITIAL_ADMIN_FIRSTNAME || 'Arthur',
        lastName: process.env.INITIAL_ADMIN_LASTNAME || 'Pendleton',
    },
};
