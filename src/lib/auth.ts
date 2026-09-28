import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import { NextRequest } from 'next/server';

export interface UserSessionPayload {
  userId: string;
  email: string;
  fullName: string;
}

export const AUTH_COOKIE_NAME = 'auth_token';

// Secret key encoded as Uint8Array for jose
const getJwtSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.trim().length < 32) {
      throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET must be set to at least 32 characters in production.');
    }
  }
  return new TextEncoder().encode(secret || 'travel-planner-dev-local-only-jwt-secret-not-for-prod');
};

/**
 * Sign a new JWT with user payload (valid for 7 days)
 */
export async function signAuthToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

/**
 * Verify JWT token string and return payload or null if invalid/expired
 */
export async function verifyAuthToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.userId || !payload.email) {
      return null;
    }
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: (payload.fullName as string) || '',
    };
  } catch {
    return null;
  }
}

/**
 * Extract and verify authentication from NextRequest or standard Request
 * Checks HTTP-only cookie first, falls back to Authorization: Bearer <token>
 */
export async function getAuthSession(
  request: NextRequest | Request
): Promise<UserSessionPayload | null> {
  let token: string | undefined;

  // 1. Try NextRequest cookies if available
  if ('cookies' in request && typeof (request as NextRequest).cookies?.get === 'function') {
    token = (request as NextRequest).cookies.get(AUTH_COOKIE_NAME)?.value;
  }

  // 2. Try standard Cookie header
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  // 3. Fallback to Authorization: Bearer <token>
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;
  return verifyAuthToken(token);
}

/**
 * Get cookie options for setting the authentication cookie
 */
export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}
