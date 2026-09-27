import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail, generateOTP } from '@/utils/email';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { validatePassword } from '@/utils/validation';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${clientIp}`, 5, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { message: 'Too many registration requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }
    const body = await request.json();

    const { fullName, email, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { message: 'All fields are required', details: { fullName: !fullName, email: !email, password: !password } },
        { status: 400 }
      );
    }

    if (typeof fullName !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { message: 'Invalid input format' },
        { status: 400 }
      );
    }

    // Enforce password length, type, and complexity on the server
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { message: passwordValidation.error || 'Password does not meet security requirements' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { message: 'Email already registered' },
          { status: 400 }
        );
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
      console.warn('Verification email dispatch warning:', emailErr);
    }

    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        message: 'Verification email sent',
        ...(isDev ? { devOtp: otp } : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Failed to register' },
      { status: 500 }
    );
  }
} 