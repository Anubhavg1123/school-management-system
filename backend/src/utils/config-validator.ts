import { config } from '../config';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateProductionConfig = (): ConfigValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isProd = config.nodeEnv === 'production';

  // Critical JWT secret checks
  if (config.jwt.accessSecret.includes('fallback_dev_access_secret')) {
    if (isProd) {
      errors.push('JWT_ACCESS_SECRET is using unsafe default fallback in production environment.');
    } else {
      warnings.push('JWT_ACCESS_SECRET is using default development fallback secret.');
    }
  }

  if (config.jwt.refreshSecret.includes('fallback_dev_refresh_secret')) {
    if (isProd) {
      errors.push('JWT_REFRESH_SECRET is using unsafe default fallback in production environment.');
    } else {
      warnings.push('JWT_REFRESH_SECRET is using default development fallback secret.');
    }
  }

  // Database URL check
  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is not configured.');
  }

  // CORS configuration
  if (!config.security.corsOrigin) {
    warnings.push('CORS_ORIGIN is not explicitly configured, defaulting to localhost.');
  }

  // BCRYPT salt rounds check
  if (config.security.bcryptSaltRounds < 10) {
    warnings.push('BCRYPT_SALT_ROUNDS is below recommended security minimum of 10.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const enforceProductionStartupValidation = () => {
  const result = validateProductionConfig();
  
  if (result.warnings.length > 0 && config.nodeEnv !== 'test') {
    result.warnings.forEach(w => console.warn(`[CONFIG WARNING] ${w}`));
  }

  if (!result.isValid) {
    const errorMessage = `FATAL CONFIGURATION ERROR:\n${result.errors.map(e => ` - ${e}`).join('\n')}`;
    console.error(errorMessage);
    if (config.nodeEnv === 'production') {
      throw new Error(errorMessage);
    }
  }
};
