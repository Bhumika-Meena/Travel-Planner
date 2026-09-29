/**
 * Structured application logger using Pino.
 *
 * - Development: human-readable pretty output via pino-pretty
 * - Production:  JSON lines to stdout (ingested by Render / cloud log aggregators)
 *
 * Usage:
 *   import logger from '@/lib/logger';
 *   logger.info({ userId }, 'User logged in');
 *   logger.error({ err }, 'Database operation failed');
 */
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    // In production, redact common sensitive fields before they hit logs
    redact: {
      paths: [
        'password',
        '*.password',
        '*.*.password',
        'otp',
        '*.otp',
        '*.*.otp',
        'token',
        '*.token',
        '*.*.token',
        'resetToken',
        '*.resetToken',
        'secret',
        '*.secret',
        'req.headers.authorization',
        'req.headers.cookie',
        'authorization',
        'cookie',
      ],
      censor: '[REDACTED]',
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  isDev
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      })
    : undefined
);

export default logger;
