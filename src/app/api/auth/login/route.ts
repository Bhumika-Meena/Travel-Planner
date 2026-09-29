import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { signAuthToken, getAuthCookieOptions } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { LoginSchema, validationError } from '@/lib/schemas';
import logger from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    // Rate limit login attempts: 8 attempts per minute per IP
    const rateLimit = checkRateLimit(`login:${clientIp}`, 8, 60 * 1000);
    if (!rateLimit.success) {
      return apiError(
        `Too many login attempts. Please try again in ${rateLimit.reset - Math.floor(Date.now() / 1000)} seconds.`,
        'RATE_LIMIT_EXCEEDED',
        429,
        undefined,
        {
          headers: {
            'Retry-After': String(rateLimit.reset - Math.floor(Date.now() / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { email, password } = parsed.data;

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      return apiError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Check if email is verified
    if (!user.isVerified) {
      return apiError('Email not verified', 'EMAIL_NOT_VERIFIED', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return apiError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Generate secure JWT token
    const token = await signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName || user.name || '',
    });

    // Remove password and sensitive tokens from user object before sending response
    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = user;

    // Create response with secure HTTP-only cookie
    const response = apiSuccess(
      { 
        user: {
          ...userWithoutPassword,
          _id: user._id.toString(),
        },
        message: 'Logged in successfully'
      },
      200
    );

    const cookieOptions = getAuthCookieOptions();
    response.cookies.set({
      name: cookieOptions.name,
      value: token,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    return apiError('Failed to login', 'INTERNAL_SERVER_ERROR', 500);
  }
}