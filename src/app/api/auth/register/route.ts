import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail, generateOTP } from '@/utils/email';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { validatePassword } from '@/utils/validation';
import { RegisterSchema, validationError } from '@/lib/schemas';
import logger from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${clientIp}`, 5, 60 * 1000);
    if (!rateLimit.success) {
      return apiError(
        'Too many registration requests. Please wait a minute and try again.',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }
    const body = await request.json();

    // Zod structural validation (types, lengths, format)
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const { fullName, email, password } = parsed.data;

    // Password complexity check (strength rules beyond basic length)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return apiError(
        passwordValidation.error || 'Password does not meet security requirements',
        'WEAK_PASSWORD',
        400
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (existingUser) {
      if (existingUser.isVerified) {
        return apiError('Email already registered', 'EMAIL_ALREADY_EXISTS', 400);
      } else {
        // If user exists but not verified, update their information
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').updateOne(
          { _id: existingUser._id },
          {
            $set: {
              fullName,
              password: hashedPassword,
              updatedAt: new Date(),
            },
          }
        );

        // Send new verification email
        const otp = generateOTP();
        await db.collection('otps').updateOne(
          { email: email.toLowerCase() },
          {
            $set: {
              otp,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
              failedAttempts: 0,
            },
          },
          { upsert: true }
        );

        try {
          await sendVerificationEmail(email, otp);
        } catch (emailErr) {
          logger.warn({ err: emailErr }, 'Verification email dispatch failed');
        }

        const isDev = process.env.NODE_ENV === 'development';

        return apiSuccess(
          { 
            message: 'Verification email sent',
            ...(isDev ? { devOtp: otp } : {})
          },
          200
        );
      }
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      points: 0,
      level: 1,
      totalTrips: 0,
      badges: [],
      trips: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate and store OTP
    const otp = generateOTP();
    await db.collection('otps').insertOne({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      failedAttempts: 0,
    });

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
        ...(isDev ? { devOtp: otp } : {}),
      },
      201
    );
  } catch (error) {
    logger.error({ err: error }, 'Registration error');
    return apiError('Failed to register', 'INTERNAL_SERVER_ERROR', 500);
  }
}