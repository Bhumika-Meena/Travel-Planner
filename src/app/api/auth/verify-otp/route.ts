import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import logger from '@/lib/logger';
import { VerifyOtpSchema, validationError } from '@/lib/schemas';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`verify-otp:${clientIp}`, 5, 60 * 1000);
    if (!rateLimit.success) {
      return apiError(
        'Too many verification attempts. Please wait a minute and try again.',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }

    const body = await request.json();
    const parsed = VerifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { email, otp } = parsed.data;

    const { db } = await connectToDatabase();

    // Find the active OTP record by email
    const otpRecord = await db.collection('otps').findOne({
      email: email.toLowerCase(),
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return apiError('Invalid or expired OTP', 'INVALID_OTP', 400);
    }

    // Check if maximum failed attempts exceeded
    if ((otpRecord.failedAttempts || 0) >= 5) {
      await db.collection('otps').deleteOne({ _id: otpRecord._id });
      return apiError(
        'Too many failed attempts. Please request a new verification code.',
        'TOO_MANY_ATTEMPTS',
        400
      );
    }

    // Timing-safe OTP comparison
    const expectedOtp = String(otpRecord.otp || '');
    const receivedOtp = String(otp);
    const isLengthMatch = expectedOtp.length === receivedOtp.length;
    const isTimingSafeMatch = isLengthMatch && crypto.timingSafeEqual(
      Buffer.from(expectedOtp, 'utf8'),
      Buffer.from(receivedOtp, 'utf8')
    );

    if (!isTimingSafeMatch) {
      const newAttempts = (otpRecord.failedAttempts || 0) + 1;
      if (newAttempts >= 5) {
        await db.collection('otps').deleteOne({ _id: otpRecord._id });
        return apiError(
          'Too many failed attempts. Please request a new verification code.',
          'TOO_MANY_ATTEMPTS',
          400
        );
      }
      await db.collection('otps').updateOne(
        { _id: otpRecord._id },
        { $inc: { failedAttempts: 1 } }
      );
      return apiError('Invalid or expired OTP', 'INVALID_OTP', 400);
    }

    // Update user's verification status
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { isVerified: true } }
    );

    // Delete the used OTP immediately to prevent replay
    await db.collection('otps').deleteOne({ _id: otpRecord._id });

    return apiSuccess({ message: 'Email verified successfully' }, 200);
  } catch (error) {
    logger.error({ err: error }, 'OTP verification error');
    return apiError('Failed to verify OTP', 'INTERNAL_SERVER_ERROR', 500);
  }
}