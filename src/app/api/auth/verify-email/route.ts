import { connectToDatabase } from '@/lib/mongodb';
import { sendVerificationEmail, generateOTP } from '@/utils/email';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { VerifyEmailSchema, validationError } from '@/lib/schemas';
import { apiSuccess, apiError } from '@/lib/api-response';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`resend-otp:${clientIp}`, 5, 60 * 1000);
    if (!rateLimit.success) {
      return apiError(
        'Too many requests. Please wait a minute and try again.',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }

    const body = await request.json();
    const parsed = VerifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { email } = parsed.data;

    const { db } = await connectToDatabase();

    // Check if user exists and is not verified
    const user = await db.collection('users').findOne({
      email: email.toLowerCase(),
      isVerified: false
    });

    if (!user) {
      return apiError(
        'User not found or already verified',
        'NOT_FOUND_OR_VERIFIED',
        400
      );
    }

    // Generate new secure OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update or create OTP record
    await db.collection('otps').updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          otp,
          expiresAt,
          failedAttempts: 0
        }
      },
      { upsert: true }
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, otp);
    } catch (emailErr) {
      logger.warn({ err: emailErr }, 'Verification email dispatch warning');
    }

    const isDev = process.env.NODE_ENV === 'development';

    return apiSuccess(
      { 
        message: 'Verification email sent',
        ...(isDev ? { devOtp: otp } : {})
      },
      200
    );
  } catch (error) {
    logger.error({ err: error }, 'Error sending verification email');
    return apiError('Failed to send verification email', 'INTERNAL_SERVER_ERROR', 500);
  }
}