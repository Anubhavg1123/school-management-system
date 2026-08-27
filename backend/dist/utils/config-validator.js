"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceProductionStartupValidation = exports.validateProductionConfig = void 0;
const config_1 = require("../config");
const validateProductionConfig = () => {
    const errors = [];
    const warnings = [];
    const isProd = config_1.config.nodeEnv === 'production';
    // Critical JWT secret checks
    if (config_1.config.jwt.accessSecret.includes('fallback_dev_access_secret')) {
        if (isProd) {
            errors.push('JWT_ACCESS_SECRET is using unsafe default fallback in production environment.');
        }
        else {
            warnings.push('JWT_ACCESS_SECRET is using default development fallback secret.');
        }
    }
    if (config_1.config.jwt.refreshSecret.includes('fallback_dev_refresh_secret')) {
        if (isProd) {
            errors.push('JWT_REFRESH_SECRET is using unsafe default fallback in production environment.');
        }
        else {
            warnings.push('JWT_REFRESH_SECRET is using default development fallback secret.');
        }
    }
    // Database URL check
    if (!config_1.config.databaseUrl) {
        errors.push('DATABASE_URL is not configured.');
    }
    // CORS configuration
    if (!config_1.config.security.corsOrigin) {
        warnings.push('CORS_ORIGIN is not explicitly configured, defaulting to localhost.');
    }
    // BCRYPT salt rounds check
    if (config_1.config.security.bcryptSaltRounds < 10) {
        warnings.push('BCRYPT_SALT_ROUNDS is below recommended security minimum of 10.');
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
};
exports.validateProductionConfig = validateProductionConfig;
const enforceProductionStartupValidation = () => {
    const result = (0, exports.validateProductionConfig)();
    if (result.warnings.length > 0 && config_1.config.nodeEnv !== 'test') {
        result.warnings.forEach(w => console.warn(`[CONFIG WARNING] ${w}`));
    }
    if (!result.isValid) {
        const errorMessage = `FATAL CONFIGURATION ERROR:\n${result.errors.map(e => ` - ${e}`).join('\n')}`;
        console.error(errorMessage);
        if (config_1.config.nodeEnv === 'production') {
            throw new Error(errorMessage);
        }
    }
};
exports.enforceProductionStartupValidation = enforceProductionStartupValidation;
