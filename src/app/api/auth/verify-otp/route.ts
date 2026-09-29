import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import logger from '@/lib/logger';

import { VerifyOtpSchema, validationError } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`verify-otp:${clientIp}`, 5, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Too many verification attempts. Please wait a minute and try again.' },
        { status: 429 }
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
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check if maximum failed attempts exceeded
    if ((otpRecord.failedAttempts || 0) >= 5) {
      await db.collection('otps').deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { message: 'Too many failed attempts. Please request a new verification code.' },
        { status: 400 }
      );
    }

    // Check OTP match
    if (otpRecord.otp !== otp) {
      const newAttempts = (otpRecord.failedAttempts || 0) + 1;
      if (newAttempts >= 5) {
        await db.collection('otps').deleteOne({ _id: otpRecord._id });
        return NextResponse.json(
          { message: 'Too many failed attempts. Please request a new verification code.' },
          { status: 400 }
        );
      }
      await db.collection('otps').updateOne(
        { _id: otpRecord._id },
        { $inc: { failedAttempts: 1 } }
      );
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Update user's verification status
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { isVerified: true } }
    );

    // Delete the used OTP
    await db.collection('otps').deleteOne({ _id: otpRecord._id });

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ err: error }, 'OTP verification error');
    return NextResponse.json(
      { message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
} 