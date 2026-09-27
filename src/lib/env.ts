/**
 * Environment configuration validator
 * Validates required configuration for production readiness without breaking development.
 */
export function validateEnvironment(): { valid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  const isProd = process.env.NODE_ENV === 'production';

  // 1. Database Connection String
  if (!process.env.MONGODB_URI) {
    if (isProd) {
      errors.push('MONGODB_URI is required in production.');
    } else {
      warnings.push('MONGODB_URI is not set. Database connections will fail.');
    }
  }

  // 2. JWT Secret
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    if (isProd) {
      errors.push('JWT_SECRET must be set to at least 32 characters in production.');
    } else {
      warnings.push('JWT_SECRET is unset or under 32 characters. Using development fallback secret.');
    }
  }

  // 3. Email configuration
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    warnings.push('Email server credentials are not fully configured. Email OTPs will not be sent via SMTP.');
  }

  // 4. AI API keys
  if (!process.env.GEMINI_API_KEY && !process.env.HUGGINGFACE_API_KEY) {
    warnings.push('Neither GEMINI_API_KEY nor HUGGINGFACE_API_KEY is configured. AI routes will use curated default places.');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
