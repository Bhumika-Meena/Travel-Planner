import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendVerificationEmail, generateOTP } from '@/utils/email';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { VerifyEmailSchema, validationError } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`resend-otp:${clientIp}`, 5, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 }
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
      return NextResponse.json(
        { message: 'User not found or already verified' },
        { status: 400 }
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
      console.warn('Verification email dispatch warning:', emailErr);
    }

    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      { 
        message: 'Verification email sent',
        ...(isDev ? { devOtp: otp } : {})
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { message: 'Failed to send verification email' },
      { status: 500 }
    );
  }
} 