/**
 * Standardized API response helpers.
 *
 * Success envelope:
 *   { success: true, data: T, ...meta }
 *
 * Error envelope:
 *   { success: false, error: { code: string, message: string, details?: any[] } }
 */

import { NextResponse } from 'next/server';

export interface ApiSuccessPayload<T = unknown> {
  success: true;
  data: T;
  [key: string]: unknown;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  // Backwards compatibility convenience field
  message?: string;
}

/**
 * Return a standardized JSON success response.
 * Includes top-level fields for backwards-compatibility with existing tests and clients.
 */
export function apiSuccess<T extends Record<string, any> | any[]>(
  data: T,
  status = 200,
  extra?: Record<string, unknown>,
  init?: ResponseInit
): NextResponse {
  // If data is an object (not array), spread it for backward compatibility so
  // older consumers reading res.user or res.trip still function alongside res.data
  const compatFields = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};

  const payload: ApiSuccessPayload<T> = {
    success: true,
    data,
    ...compatFields,
    ...(extra || {}),
  };

  return NextResponse.json(payload, { status, ...init });
}

/**
 * Return a standardized JSON error response.
 */
export function apiError(
  message: string,
  code: string = 'ERROR',
  status = 400,
  details?: ApiErrorDetail[],
  init?: ResponseInit
): NextResponse {
  const payload: ApiErrorPayload = {
    success: false,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
    // Backwards-compatible top-level message
    message,
  };

  return NextResponse.json(payload, { status, ...init });
}
